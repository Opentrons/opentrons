"""Test equalize_timeout_s / residual vacuum interactions with move_labware.

Each case is selected via the ``test_case`` runtime parameter so analysis and
runtime can be validated independently:

| Case id                    | Vacuum path                         | Equalize? | Expected move |
|----------------------------|-------------------------------------|-----------|---------------|
| cold_start_move            | none                                | n/a       | PASS          |
| pressure_hold_equalize     | pressure + duration + vent_after    | yes       | PASS          |
| pressure_hold_no_equalize  | pressure + duration + vent_after    | no        | FAIL residual |
| open_vent_equalize         | pressure hold (no eq) then open_vent| yes       | PASS          |
| open_vent_no_equalize      | pressure hold (no eq) then open_vent| no        | FAIL residual |
| pump_engaged               | pressure hold forever               | n/a       | FAIL pump on  |
| stop_without_vent          | pressure hold forever then stop     | no        | FAIL residual |
| power_hold_equalize        | power + duration + vent_after       | yes       | PASS          |
| power_hold_no_equalize     | power + duration + vent_after       | no        | FAIL residual |
| profile_equalize           | profile (ends pump off) + vent      | yes       | PASS          |
| profile_no_equalize        | profile (ends pump off) + vent      | no        | FAIL residual |

Analysis (virtual modules) uses PE residual-vacuum / pump_engaged state.
Runtime still uses the hardware gauge for residual vacuum when the pump is off.

Use short pressure setpoints and hold times so runtime runs finish quickly.
For FAIL cases on real hardware, recover by opening the vent and equalizing,
then resume so the retried move can succeed.
"""
from typing import Callable, Dict, List, cast

from opentrons.hardware_control.modules.types import (
    VacuumModulePressureStep,
    VacuumModuleStep,
)
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    VacuumModuleContext,
)

metadata = {
    "protocolName": "Vacuum Module Equalize / Move Labware Cases",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": (
        "Parameterized cases for equalize_timeout_s and residual vacuum "
        "interactions with move_labware to/from the Vacuum Module."
    ),
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}

# Mild vacuum + short holds keep QC / sim runs fast.
_DEFAULT_PRESSURE_MBAR = -200
_DEFAULT_HOLD_S = 8
_DEFAULT_EQUALIZE_S = 30
_DEFAULT_POWER_PCT = 40


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        variable_name="test_case",
        display_name="Test Case",
        description="Which equalize / move_labware scenario to run.",
        default="pressure_hold_equalize",
        # display_name max 30 chars (RTP validation)
        choices=[
            {"display_name": "PASS: cold start move", "value": "cold_start_move"},
            {
                "display_name": "PASS: pressure+equalize",
                "value": "pressure_hold_equalize",
            },
            {
                "display_name": "FAIL: pressure no equalize",
                "value": "pressure_hold_no_equalize",
            },
            {"display_name": "PASS: open_vent+equalize", "value": "open_vent_equalize"},
            {
                "display_name": "FAIL: open_vent no equalize",
                "value": "open_vent_no_equalize",
            },
            {"display_name": "FAIL: pump engaged move", "value": "pump_engaged"},
            {"display_name": "FAIL: stop, vent closed", "value": "stop_without_vent"},
            {"display_name": "PASS: power+equalize", "value": "power_hold_equalize"},
            {
                "display_name": "FAIL: power no equalize",
                "value": "power_hold_no_equalize",
            },
            {"display_name": "PASS: profile+equalize", "value": "profile_equalize"},
            {
                "display_name": "FAIL: profile no equalize",
                "value": "profile_no_equalize",
            },
        ],
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="Collar loaded on the vacuum module (starts on the module).",
        default="opentrons_vacuum_manifold_collar_short",
        choices=[
            {
                "display_name": "Opentrons: Short",
                "value": "opentrons_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Opentrons: Tall",
                "value": "opentrons_vacuum_manifold_collar_tall",
            },
            {
                "display_name": "Millipore: Short",
                "value": "millipore_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Millipore: Tall",
                "value": "millipore_vacuum_manifold_collar_tall",
            },
        ],
    )
    parameters.add_int(
        display_name="Target Pressure (mbar)",
        variable_name="target_pressure_mbar",
        description="Gauge pressure for pressure / profile cases.",
        default=_DEFAULT_PRESSURE_MBAR,
        minimum=-800,
        maximum=-50,
    )
    parameters.add_int(
        display_name="Hold (seconds)",
        variable_name="hold_seconds",
        description="Pump hold duration for timed vacuum / power cases.",
        default=_DEFAULT_HOLD_S,
        minimum=3,
        maximum=120,
    )
    parameters.add_int(
        display_name="Equalize Timeout (seconds)",
        variable_name="equalize_timeout_s",
        description="Used only by cases that wait for equalization.",
        default=_DEFAULT_EQUALIZE_S,
        minimum=5,
        maximum=300,
    )
    parameters.add_bool(
        variable_name="use_gripper",
        display_name="Use Gripper",
        description="If false, pauses for a manual labware move.",
        default=True,
    )


def _comment_expectation(ctx: ProtocolContext, should_pass: bool, reason: str) -> None:
    if should_pass:
        ctx.comment(f"EXPECT PASS: move_labware should succeed. ({reason})")
    else:
        ctx.comment(
            f"EXPECT FAIL: move_labware should error. ({reason}) "
            "Analysis: residual vacuum or pump engaged. "
            "Runtime residual: VacuumModuleStillUnderVacuumError / "
            "vacuumModuleUnderVacuum. Runtime pump: VacuumModuleUnderVacuumError."
        )


def _move_collar_to_dock(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
) -> None:
    ctx.move_labware(
        collar,  # type: ignore[arg-type]
        vm_mod.manifold_dock,  # type: ignore[attr-defined]
        use_gripper=use_gripper,
    )


def _return_collar_to_module(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
) -> None:
    ctx.comment("Cleanup: ensure chamber is atmospheric, return collar to module.")
    vm_mod.stop_vacuum_pump()
    vm_mod.open_vent(equalize_timeout_s=_DEFAULT_EQUALIZE_S)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_cold_start_move(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del pressure_mbar, hold_s, equalize_s
    _comment_expectation(
        ctx, True, "no vacuum applied; residual_vacuum and pump_engaged are false"
    )
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_pressure_hold_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    _comment_expectation(
        ctx,
        True,
        "duration + vent_after + equalize_timeout_s clears residual vacuum in PE",
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        duration_s=hold_s,
        vent_after=True,
        equalize_timeout_s=equalize_s,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_pressure_hold_no_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del equalize_s
    _comment_expectation(
        ctx,
        False,
        "vent_after without equalize_timeout_s leaves residual_vacuum true",
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        duration_s=hold_s,
        vent_after=True,
        # omit equalize_timeout_s → do not wait
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


def _case_open_vent_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    _comment_expectation(
        ctx, True, "open_vent(equalize_timeout_s) clears residual after vacuum"
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        duration_s=hold_s,
        vent_after=False,
    )
    ctx.wait_for_tasks([task])
    vm_mod.stop_vacuum_pump()
    vm_mod.open_vent(equalize_timeout_s=equalize_s)
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_open_vent_no_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del equalize_s
    _comment_expectation(
        ctx, False, "open_vent() without timeout does not clear residual vacuum"
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        duration_s=hold_s,
        vent_after=False,
    )
    ctx.wait_for_tasks([task])
    vm_mod.stop_vacuum_pump()
    vm_mod.open_vent()  # no equalize_timeout_s
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


def _case_pump_engaged(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del hold_s, equalize_s
    _comment_expectation(
        ctx, False, "duration_s omitted → pump stays engaged; move must fail"
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        # hold forever
        vent_after=False,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


def _case_stop_without_vent(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del equalize_s
    _comment_expectation(
        ctx,
        False,
        "stop_vacuum_pump leaves residual vacuum until vent + equalize",
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=pressure_mbar,
        duration_s=hold_s,
        vent_after=False,
    )
    ctx.wait_for_tasks([task])
    vm_mod.stop_vacuum_pump()
    # vent stays closed → residual vacuum
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


def _case_power_hold_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del pressure_mbar
    _comment_expectation(
        ctx, True, "power hold + vent_after + equalize_timeout_s clears residual"
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_power(
        percent_power=_DEFAULT_POWER_PCT,
        duration_s=hold_s,
        vent_after=True,
        equalize_timeout_s=equalize_s,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_power_hold_no_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del pressure_mbar, equalize_s
    _comment_expectation(
        ctx, False, "power hold + vent_after without equalize leaves residual"
    )
    vm_mod.close_vent()
    task = vm_mod.start_set_vacuum_power(
        percent_power=_DEFAULT_POWER_PCT,
        duration_s=hold_s,
        vent_after=True,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


def _case_profile_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    # Final step leaves enable_pump=False so PE pump_engaged is false.
    # vent_after only opens the vent (does not imply pump state); equalize
    # clears residual_vacuum independently.
    _comment_expectation(
        ctx,
        True,
        "profile ends with pump off + vent_after + equalize_timeout_s",
    )
    vm_mod.close_vent()
    # Stop-pump step: enable_pump=False with no pressure/power setpoint.
    steps: List[VacuumModuleStep] = [
        VacuumModulePressureStep(
            enable_pump=True,
            gauge_pressure_mbar=pressure_mbar,
            hold_time_seconds=hold_s,
        ),
        VacuumModulePressureStep(enable_pump=False, gauge_pressure_mbar=None),
    ]
    task = vm_mod.start_execute_profile(
        steps=steps,
        repetitions=1,
        vent_after=True,
        equalize_timeout_s=equalize_s,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)
    ctx.move_labware(collar, vm_mod, use_gripper=use_gripper)  # type: ignore[arg-type]


def _case_profile_no_equalize(
    ctx: ProtocolContext,
    vm_mod: VacuumModuleContext,
    collar: object,
    use_gripper: bool,
    pressure_mbar: int,
    hold_s: int,
    equalize_s: int,
) -> None:
    del equalize_s
    # Pump left off so the move fails on residual vacuum, not pump_engaged.
    _comment_expectation(
        ctx,
        False,
        "profile pump off + vent_after without equalize leaves residual",
    )
    vm_mod.close_vent()
    steps: List[VacuumModuleStep] = [
        VacuumModulePressureStep(
            enable_pump=True,
            gauge_pressure_mbar=pressure_mbar,
            hold_time_seconds=hold_s,
        ),
        VacuumModulePressureStep(enable_pump=False, gauge_pressure_mbar=None),
    ]
    task = vm_mod.start_execute_profile(
        steps=steps,
        repetitions=1,
        vent_after=True,
    )
    ctx.wait_for_tasks([task])
    _move_collar_to_dock(ctx, vm_mod, collar, use_gripper)


_CASES: Dict[
    str,
    Callable[
        [ProtocolContext, VacuumModuleContext, object, bool, int, int, int],
        None,
    ],
] = {
    "cold_start_move": _case_cold_start_move,
    "pressure_hold_equalize": _case_pressure_hold_equalize,
    "pressure_hold_no_equalize": _case_pressure_hold_no_equalize,
    "open_vent_equalize": _case_open_vent_equalize,
    "open_vent_no_equalize": _case_open_vent_no_equalize,
    "pump_engaged": _case_pump_engaged,
    "stop_without_vent": _case_stop_without_vent,
    "power_hold_equalize": _case_power_hold_equalize,
    "power_hold_no_equalize": _case_power_hold_no_equalize,
    "profile_equalize": _case_profile_equalize,
    "profile_no_equalize": _case_profile_no_equalize,
}

_PASS_CASES = frozenset(
    {
        "cold_start_move",
        "pressure_hold_equalize",
        "open_vent_equalize",
        "power_hold_equalize",
        "profile_equalize",
    }
)


def run(ctx: ProtocolContext) -> None:
    """Run a single selected equalize / move_labware case."""
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    ctx.load_trash_bin("A1")

    test_case = cast(str, ctx.params.test_case)  # type: ignore[attr-defined]
    collar_name = cast(str, ctx.params.collar)  # type: ignore[attr-defined]
    pressure_mbar = cast(int, ctx.params.target_pressure_mbar)  # type: ignore[attr-defined]
    hold_s = cast(int, ctx.params.hold_seconds)  # type: ignore[attr-defined]
    equalize_s = cast(int, ctx.params.equalize_timeout_s)  # type: ignore[attr-defined]
    use_gripper = cast(bool, ctx.params.use_gripper)  # type: ignore[attr-defined]

    if test_case not in _CASES:
        raise ValueError(f"Unknown test_case: {test_case!r}")

    # Collar starts sealed on the module so vacuum cases have a closed chamber.
    collar = vm_mod.load_adapter(collar_name)

    ctx.home()
    ctx.comment(f"=== Case: {test_case} ===")
    if test_case in _PASS_CASES:
        ctx.comment("This case is expected to complete successfully.")
    else:
        ctx.comment(
            "This case is expected to fail on move_labware. "
            "On hardware, recover by venting + equalizing, then resume."
        )
        ctx.pause(
            f"About to run FAIL-expected case '{test_case}'. "
            "Continue when ready to attempt the blocked move."
        )

    case_fn = _CASES[test_case]
    case_fn(ctx, vm_mod, collar, use_gripper, pressure_mbar, hold_s, equalize_s)

    if test_case in _PASS_CASES:
        ctx.comment(f"Case '{test_case}' completed as expected.")
    else:
        # If we got here, either recovery succeeded after a runtime error,
        # or analysis unexpectedly allowed the move (pre residual-vacuum work).
        ctx.comment(
            f"Case '{test_case}' reached cleanup after the move. "
            "If you expected a hard analysis failure, check residual vacuum tracking."
        )
        _return_collar_to_module(ctx, vm_mod, collar, use_gripper)
