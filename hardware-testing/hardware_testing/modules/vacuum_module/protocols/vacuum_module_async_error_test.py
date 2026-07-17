"""Runtime test for vacuum module async error recovery.

Starts background vacuum tasks via the selected Protocol API, injects firmware-style
async G-code errors from the protocol, and exercises associated-command recovery in
different queue/timing situations.

Scenarios:
- ``wait_for_tasks_single``: inject, then wait on the vacuum task (baseline).
- ``wait_for_tasks_multiple``: inject, then wait on vacuum + timer tasks together.
- ``async_error_outside_wait``: inject while vacuum runs, continue with delay/commands
  before calling ``wait_for_tasks``.
- ``async_error_during_gantry``: inject, then run pipette motion before waiting.
- ``latest_background_start``: start a second vacuum background command before inject
  to verify recovery associates with the latest start command.

Expected runtime flow for recoverable errors (ERR400/ERR401):
1. Protocol starts the selected vacuum background API and returns a concurrent task.
2. Protocol injects the selected async G-code error response.
3. The app should enter associated-command recovery instead of stopping the run.
4. Resolve recovery in the app, then let the protocol continue to cleanup.

Do not call ``ctx.pause()`` after injection. A protocol pause blocks the command
queue worker and prevents error-recovery fixit commands (such as homing) from running.
"""
from typing import cast

from opentrons.protocols.parameters.types import ParameterChoice
from opentrons.protocol_api import (
    InstrumentContext,
    Labware,
    ParameterContext,
    ProtocolContext,
    Task,
    TrashBin,
    VacuumModuleContext,
)

metadata = {
    "protocolName": "Vacuum Module Async Error Injection Test",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": (
        "Injects firmware-style async G-code errors during vacuum background "
        "tasks to exercise associated-command error recovery across timing cases."
    ),
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}

_PRESET_GCODE: dict[str, str] = {
    "waste_full": "async ERR401:waste container full",
    "pressure_not_reached": "async ERR400:pressure not reached",
}

_SCENARIO_CHOICES: list[ParameterChoice] = [
    {
        "display_name": "Single task wait (baseline)",
        "value": "wait_for_tasks_single",
    },
    {
        "display_name": "Vacuum + timer wait",
        "value": "wait_for_tasks_multiple",
    },
    {
        "display_name": "Error outside wait",
        "value": "async_error_outside_wait",
    },
    {
        "display_name": "Error during gantry work",
        "value": "async_error_during_gantry",
    },
    {
        "display_name": "Latest background start",
        "value": "latest_background_start",
    },
]


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        variable_name="test_scenario",
        display_name="Test Scenario",
        description="Which async error recovery timing case to exercise.",
        default="wait_for_tasks_single",
        choices=_SCENARIO_CHOICES,
    )
    parameters.add_str(
        variable_name="vacuum_api",
        display_name="Vacuum Background API",
        description="Background vacuum API to start before injecting the async error.",
        default="start_set_vacuum_pressure",
        choices=[
            {
                "display_name": "start_set_vacuum_pressure",
                "value": "start_set_vacuum_pressure",
            },
            {
                "display_name": "start_set_vacuum_power",
                "value": "start_set_vacuum_power",
            },
            {
                "display_name": "start_execute_profile",
                "value": "start_execute_profile",
            },
        ],
    )
    parameters.add_str(
        variable_name="async_error_preset",
        display_name="Async Error Preset",
        description="Recoverable vacuum async error to inject after starting vacuum.",
        default="waste_full",
        choices=[
            {"display_name": "Waste container full (ERR401)", "value": "waste_full"},
            {
                "display_name": "Pressure not reached (ERR400)",
                "value": "pressure_not_reached",
            },
        ],
    )
    parameters.add_int(
        display_name="Target Pressure (mbar)",
        variable_name="target_pressure_mbar",
        description="Gauge pressure setpoint for pressure API and profile steps.",
        default=-300,
        minimum=-800,
        maximum=-50,
    )
    parameters.add_int(
        display_name="Target Power (%)",
        variable_name="target_percent_power",
        description="Pump duty cycle for start_set_vacuum_power.",
        default=50,
        minimum=1,
        maximum=100,
    )
    parameters.add_int(
        display_name="Vacuum Hold (seconds)",
        variable_name="vacuum_hold_seconds",
        description="Hold duration for timed vacuum background tasks and profile steps.",
        default=60,
        minimum=10,
        maximum=600,
    )
    parameters.add_int(
        display_name="Profile Repetitions",
        variable_name="profile_repetitions",
        description="Repetitions for start_execute_profile.",
        default=1,
        minimum=1,
        maximum=10,
    )
    parameters.add_float(
        display_name="Inject Delay (seconds)",
        variable_name="inject_delay_seconds",
        description="Wait after starting vacuum before injecting the async error.",
        default=2.0,
        minimum=0.5,
        maximum=30.0,
    )
    parameters.add_float(
        display_name="Post-Inject Delay (seconds)",
        variable_name="post_inject_delay_seconds",
        description="Delay after injection in scenarios that defer wait_for_tasks.",
        default=3.0,
        minimum=0.0,
        maximum=30.0,
    )
    parameters.add_float(
        display_name="Timer Duration (seconds)",
        variable_name="timer_duration_seconds",
        description="Duration for create_timer in multi-task scenarios.",
        default=8.0,
        minimum=1.0,
        maximum=120.0,
    )
    parameters.add_int(
        display_name="Gantry Transfer Volume (µL)",
        variable_name="gantry_transfer_volume_ul",
        description="Transfer volume for the gantry-overlap scenario.",
        default=50,
        minimum=1,
        maximum=200,
    )


def inject_async_gcode_response(
    module: VacuumModuleContext,
    gcode_response: str,
    command: str = "M121",
) -> None:
    """Inject a firmware-style async G-code error for testing error recovery."""
    module._core.inject_async_gcode_response(
        gcode_response=gcode_response,
        command=command,
    )


def _resolve_gcode_response(ctx: ProtocolContext) -> str:
    preset = ctx.params.async_error_preset  # type: ignore[attr-defined]
    return _PRESET_GCODE[preset]


def _start_vacuum_task(
    vm_mod: VacuumModuleContext,
    ctx: ProtocolContext,
    *,
    vacuum_api: str | None = None,
) -> Task:
    """Start the selected vacuum background API and return its task."""
    selected_api = vacuum_api or ctx.params.vacuum_api  # type: ignore[attr-defined]
    target_pressure = ctx.params.target_pressure_mbar  # type: ignore[attr-defined]
    target_power = ctx.params.target_percent_power  # type: ignore[attr-defined]
    hold_seconds = ctx.params.vacuum_hold_seconds  # type: ignore[attr-defined]
    profile_repetitions = ctx.params.profile_repetitions  # type: ignore[attr-defined]

    if selected_api == "start_set_vacuum_pressure":
        ctx.comment(
            f"Starting start_set_vacuum_pressure to {target_pressure} mbar "
            f"for {hold_seconds}s (background task)."
        )
        return vm_mod.start_set_vacuum_pressure(
            target_pressure,
            hold_seconds,
            vent_after=False,
        )

    if selected_api == "start_set_vacuum_power":
        ctx.comment(
            f"Starting start_set_vacuum_power at {target_power}% "
            f"for {hold_seconds}s (background task)."
        )
        return vm_mod.start_set_vacuum_power(
            target_power,
            hold_seconds,
            vent_after=False,
        )

    if selected_api == "start_execute_profile":
        ctx.comment(
            f"Starting start_execute_profile with one pressure step to "
            f"{target_pressure} mbar for {hold_seconds}s, "
            f"{profile_repetitions} repetition(s) (background task)."
        )
        return vm_mod.start_execute_profile(
            steps=[
                {
                    "enable_pump": True,
                    "gauge_pressure_mbar": target_pressure,
                    "hold_time_seconds": hold_seconds,
                    "vent_after": False,
                }
            ],
            repetitions=profile_repetitions,
            vent_after=False,
        )

    raise ValueError(f"Unsupported vacuum API: {selected_api!r}")


def _wait_for_injection(ctx: ProtocolContext, vacuum_api: str) -> None:
    inject_delay = ctx.params.inject_delay_seconds  # type: ignore[attr-defined]
    ctx.delay(
        seconds=inject_delay,
        msg=f"Waiting for {vacuum_api} to start before injection.",
    )


def _inject_async_error(ctx: ProtocolContext, vm_mod: VacuumModuleContext) -> str:
    gcode_response = _resolve_gcode_response(ctx)
    ctx.comment(f"Injecting async G-code response: {gcode_response!r}")
    inject_async_gcode_response(vm_mod, gcode_response)
    ctx.comment(
        "Async error injected. Recoverable errors (ERR400/ERR401) should enter "
        "associated-command recovery instead of stopping the run."
    )
    return gcode_response


def _load_pipette(ctx: ProtocolContext) -> tuple[InstrumentContext, Labware]:
    tiprack = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "C1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    reservoir = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "B2")
    pip = ctx.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack])
    return pip, reservoir


def _run_minimal_gantry_transfer(ctx: ProtocolContext, trash: TrashBin) -> None:
    pip, reservoir = _load_pipette(ctx)
    volume = ctx.params.gantry_transfer_volume_ul  # type: ignore[attr-defined]
    ctx.comment(
        f"Running pipette transfer ({volume} µL) after async injection. "
        "Recovery may already be active; this command should still complete."
    )
    pip.pick_up_tip()
    pip.aspirate(volume, reservoir["A1"].bottom(z=5))
    pip.dispense(volume, trash.top())
    pip.return_tip()


def _finish_waiting_for_tasks(
    ctx: ProtocolContext,
    tasks: list[Task],
    *,
    label: str,
) -> None:
    ctx.comment(f"{label}: waiting for {len(tasks)} task(s).")
    ctx.wait_for_tasks(tasks)


def _scenario_wait_for_tasks_single(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    vacuum_task: Task,
) -> None:
    _inject_async_error(ctx, vm_mod)
    _finish_waiting_for_tasks(
        ctx,
        [vacuum_task],
        label="Baseline scenario",
    )


def _scenario_wait_for_tasks_multiple(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    vacuum_task: Task,
    timer_task: Task,
) -> None:
    _inject_async_error(ctx, vm_mod)
    _finish_waiting_for_tasks(
        ctx,
        [vacuum_task, timer_task],
        label="Multi-task scenario",
    )


def _scenario_async_error_outside_wait(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    vacuum_task: Task,
) -> None:
    _inject_async_error(ctx, vm_mod)
    post_inject_delay = ctx.params.post_inject_delay_seconds  # type: ignore[attr-defined]
    ctx.comment(
        "Continuing protocol without wait_for_tasks. The app should already show "
        "recovery while these commands execute."
    )
    ctx.delay(
        seconds=post_inject_delay,
        msg="Observing recovery outside wait_for_tasks.",
    )
    ctx.comment("Issuing a comment command after recovery should have started.")
    _finish_waiting_for_tasks(
        ctx,
        [vacuum_task],
        label="Outside-wait scenario cleanup",
    )


def _scenario_async_error_during_gantry(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    vacuum_task: Task,
    trash: TrashBin,
) -> None:
    _inject_async_error(ctx, vm_mod)
    _run_minimal_gantry_transfer(ctx, trash)
    _finish_waiting_for_tasks(
        ctx,
        [vacuum_task],
        label="Gantry-overlap scenario cleanup",
    )


def _scenario_latest_background_start(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    vacuum_task: Task,
) -> None:
    primary_api = ctx.params.vacuum_api  # type: ignore[attr-defined]
    secondary_api = (
        "start_set_vacuum_power"
        if primary_api != "start_set_vacuum_power"
        else "start_set_vacuum_pressure"
    )

    ctx.comment(
        f"Primary background command already started via {primary_api!r}. "
        f"Starting a second background command via {secondary_api!r}. "
        "The second task may cancel immediately while the first still holds the "
        "module lock; recovery should still target the latest start command."
    )
    secondary_task = _start_vacuum_task(vm_mod, ctx, vacuum_api=secondary_api)
    _inject_async_error(ctx, vm_mod)
    ctx.comment(
        "Recovery should associate with the latest background start command "
        f"({secondary_api!r}), not the first ({primary_api!r})."
    )
    _finish_waiting_for_tasks(
        ctx,
        [vacuum_task, secondary_task],
        label="Latest-start scenario",
    )


def run(ctx: ProtocolContext) -> None:
    """Run the selected async error recovery scenario."""
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    trash = ctx.load_trash_bin("A1")

    scenario = ctx.params.test_scenario  # type: ignore[attr-defined]
    vacuum_api = ctx.params.vacuum_api  # type: ignore[attr-defined]
    timer_duration = ctx.params.timer_duration_seconds  # type: ignore[attr-defined]

    ctx.home()
    vm_mod.close_vent()

    vacuum_task = _start_vacuum_task(vm_mod, ctx)
    timer_task = ctx.create_timer(timer_duration)
    _wait_for_injection(ctx, vacuum_api)

    if scenario == "wait_for_tasks_single":
        _scenario_wait_for_tasks_single(ctx, vm_mod, vacuum_task)
    elif scenario == "wait_for_tasks_multiple":
        _scenario_wait_for_tasks_multiple(ctx, vm_mod, vacuum_task, timer_task)
    elif scenario == "async_error_outside_wait":
        _scenario_async_error_outside_wait(ctx, vm_mod, vacuum_task)
    elif scenario == "async_error_during_gantry":
        _scenario_async_error_during_gantry(ctx, vm_mod, vacuum_task, trash)
    elif scenario == "latest_background_start":
        _scenario_latest_background_start(ctx, vm_mod, vacuum_task)
    else:
        raise ValueError(f"Unsupported test scenario: {scenario!r}")

    ctx.comment("Cleanup: stop pump and vent.")
    vm_mod.stop_vacuum_pump()
