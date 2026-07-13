"""Runtime test for VacuumModuleStillUnderVacuumError on moveLabware.

Evacuates the vacuum module chamber, waits for the pump to stop, then attempts to
move labware off the module while pressure is still below atmospheric. On real
hardware this should return a recoverable ``vacuumModuleUnderVacuum`` defined error
on ``moveLabware``. Protocol analysis and simulation will pass the move because the
under-vacuum hardware check is not performed with virtual modules.

Expected runtime flow:
1. Protocol evacuates the chamber and stops the pump (vent stays closed).
2. The gripper move to the dock fails with ``vacuumModuleUnderVacuum``.
3. Open the vent (or call ``stop_vacuum_pump()``) and wait for pressure to equalize.
4. Resume the run; the retried move should succeed.
"""
from typing import cast

from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    VacuumModuleContext,
)

metadata = {
    "protocolName": "Vacuum Module Still Under Vacuum Error Test",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": (
        "Triggers the recoverable vacuumModuleUnderVacuum defined error on "
        "moveLabware when the pump is off but the chamber is still evacuating."
    ),
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="Collar loaded on the vacuum module dock.",
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
        description="Gauge pressure setpoint. More negative = stronger vacuum.",
        default=-300,
        minimum=-800,
        maximum=-50,
    )
    parameters.add_int(
        display_name="Vacuum Hold (seconds)",
        variable_name="vacuum_hold_seconds",
        description="Timed pump run. Vent stays closed after the pump stops.",
        default=10,
        minimum=5,
        maximum=120,
    )


def run(ctx: ProtocolContext) -> None:
    """Evacuate the module, then attempt a labware move while still under vacuum."""
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    ctx.load_trash_bin("A1")

    collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]
    target_pressure = ctx.params.target_pressure_mbar  # type: ignore[attr-defined]
    hold_seconds = ctx.params.vacuum_hold_seconds  # type: ignore[attr-defined]

    ctx.home()

    ctx.comment("Move collar from dock onto vacuum module.")
    ctx.move_labware(collar, vm_mod, use_gripper=True)

    ctx.comment(
        f"Evacuate to {target_pressure} mbar for {hold_seconds}s with vent closed. "
        "Pump will stop when the timer expires; chamber stays under vacuum."
    )
    vm_mod.close_vent()
    vacuum_task = vm_mod.start_set_vacuum_pressure(
        target_pressure,
        hold_seconds,
        vent_after=False,
    )
    ctx.wait_for_tasks([vacuum_task])

    ctx.comment(
        "Pump is off but chamber should still be under vacuum. "
        "NEXT MOVE SHOULD FAIL on real hardware with recoverable error "
        "vacuumModuleUnderVacuum (VacuumModuleStillUnderVacuumError). "
        "Analysis/simulation will not raise this error."
    )
    ctx.pause(
        "Ready to attempt move while chamber is still under vacuum. "
        "On hardware, expect vacuumModuleUnderVacuum. "
        "After the error, open the vent and resume to retry the move."
    )

    ctx.move_labware(collar, vm_mod.manifold_dock, use_gripper=True)  # type: ignore[attr-defined]

    ctx.comment(
        "Move succeeded. If this followed a recoverable error, venting and "
        "resuming worked as expected."
    )

    ctx.comment("Cleanup: vent chamber and return collar to module.")
    vm_mod.stop_vacuum_pump()
    ctx.move_labware(collar, vm_mod, use_gripper=True)
