"""Runtime test for vacuum module async error recovery.

Starts a background vacuum task via the selected Protocol API, injects a
firmware-style async G-code error from the protocol, then waits for the task.
Recoverable errors such as waste-full (ERR401) or pressure-not-reached (ERR400)
should associate with the originating background start command and enter error
recovery instead of stopping the run.

Expected runtime flow:
1. Protocol starts the selected vacuum background API and returns a concurrent task.
2. Protocol injects the selected async G-code error response.
3. ``wait_for_tasks`` enters recovery for recoverable errors (ERR400/ERR401).
4. Use the app recovery UI to dismiss or retry, then vent/stop as needed.

Do not call ``ctx.pause()`` after injection. A protocol pause blocks the command
queue worker and prevents error-recovery fixit commands (such as homing) from
running.
"""
from typing import cast

from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Task,
    VacuumModuleContext,
)

metadata = {
    "protocolName": "Vacuum Module Async Error Injection Test",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": (
        "Injects firmware-style async G-code errors during a vacuum background "
        "task to exercise associated-command error recovery."
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


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
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


def _start_vacuum_task(vm_mod: VacuumModuleContext, ctx: ProtocolContext) -> Task:
    """Start the selected vacuum background API and return its task."""
    vacuum_api = ctx.params.vacuum_api  # type: ignore[attr-defined]
    target_pressure = ctx.params.target_pressure_mbar  # type: ignore[attr-defined]
    target_power = ctx.params.target_percent_power  # type: ignore[attr-defined]
    hold_seconds = ctx.params.vacuum_hold_seconds  # type: ignore[attr-defined]
    profile_repetitions = ctx.params.profile_repetitions  # type: ignore[attr-defined]

    if vacuum_api == "start_set_vacuum_pressure":
        ctx.comment(
            f"Starting start_set_vacuum_pressure to {target_pressure} mbar "
            f"for {hold_seconds}s (background task)."
        )
        return vm_mod.start_set_vacuum_pressure(
            target_pressure,
            hold_seconds,
            vent_after=False,
        )

    if vacuum_api == "start_set_vacuum_power":
        ctx.comment(
            f"Starting start_set_vacuum_power at {target_power}% "
            f"for {hold_seconds}s (background task)."
        )
        return vm_mod.start_set_vacuum_power(
            target_power,
            hold_seconds,
            vent_after=False,
        )

    if vacuum_api == "start_execute_profile":
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

    raise ValueError(f"Unsupported vacuum API: {vacuum_api!r}")


def run(ctx: ProtocolContext) -> None:
    """Start vacuum, inject an async error, and wait for associated recovery."""
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    ctx.load_trash_bin("A1")

    inject_delay = ctx.params.inject_delay_seconds  # type: ignore[attr-defined]
    gcode_response = _resolve_gcode_response(ctx)
    vacuum_api = ctx.params.vacuum_api  # type: ignore[attr-defined]

    ctx.home()
    vm_mod.close_vent()

    vacuum_task = _start_vacuum_task(vm_mod, ctx)
    timer_task = ctx.create_timer(inject_delay * 1.5)

    ctx.delay(
        seconds=inject_delay,
        msg=f"Waiting for {vacuum_api} to start before injection.",
    )

    ctx.comment(f"Injecting async G-code response: {gcode_response!r}")
    inject_async_gcode_response(vm_mod, gcode_response)

    ctx.comment(
        "Async error injected. wait_for_tasks should enter recovery for "
        "recoverable errors (ERR400/ERR401). Resolve recovery in the app, "
        "then resume to finish cleanup."
    )
    ctx.comment("Waiting for vacuum task (expect recovery, not run stop).")
    ctx.wait_for_tasks([vacuum_task])

    ctx.comment("Cleanup: stop pump and vent.")
    vm_mod.stop_vacuum_pump()
