"""Vacuum Module QC Protocol."""
from typing import List, cast

from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.protocol_api import (
    Labware,
    ParameterContext,
    ProtocolContext,
    VacuumModuleContext,
)
from opentrons.protocol_api.core.engine.module_core import VacuumModuleCore
from opentrons.protocols.parameters.types import ParameterChoice


metadata = {
    "protocolName": "Vacuum Module DVT QC Protocol V0.3",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}

PIPETTE_CHOICES: List[ParameterChoice] = [
    {"display_name": "1ch 50µL", "value": "flex_1channel_50"},
    {"display_name": "1ch 1000µL", "value": "flex_1channel_1000"},
    {"display_name": "8ch 50µL", "value": "flex_8channel_50"},
    {"display_name": "8ch 1000µL", "value": "flex_8channel_1000"},
    {"display_name": "96ch 200µL", "value": "flex_96channel_200"},
    {"display_name": "96ch 1000µL", "value": "flex_96channel_1000"},
]

MOUNT_CHOICES: List[ParameterChoice] = [
    {"display_name": "Left", "value": "left"},
    {"display_name": "Right", "value": "right"},
]


def _compatible_tip_racks(
    pipette_type: str,
    tiprack_50: Labware,
    tiprack_200: Labware,
    tiprack_1000: Labware,
) -> tuple[List[Labware], List[Labware]]:
    """Return per-step tip racks and load_instrument tip racks for a pipette."""
    if pipette_type in ("flex_1channel_50", "flex_8channel_50"):
        step_tip_racks = [tiprack_50, tiprack_50, tiprack_50]
        instrument_tip_racks = [tiprack_50]
    elif pipette_type == "flex_96channel_200":
        step_tip_racks = [tiprack_200, tiprack_200, tiprack_50]
        instrument_tip_racks = [tiprack_50, tiprack_200]
    else:
        step_tip_racks = [tiprack_1000, tiprack_200, tiprack_50]
        instrument_tip_racks = [tiprack_50, tiprack_200, tiprack_1000]
    return step_tip_racks, instrument_tip_racks


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_int(
        display_name="Cycles",
        variable_name="cycles",
        description="The number of cycles to perform.",
        default=1,
        minimum=1,
        maximum=1000,
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="The kind of Collar (Opentrons or Millipore)",
        default="millipore_vacuum_manifold_collar_short",
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
        display_name="Target Pressure (MBar)",
        variable_name="target_pressure",
        description="The target gauge pressure in mbar.",
        default=-200,
        minimum=-800,
        maximum=0,
    )
    parameters.add_int(
        display_name="Vacuum Hold Seconds",
        variable_name="hold_time",
        description="The vacuum hold time in seconds.",
        default=60,
        minimum=1,
        maximum=60 * 60 * 12,  # 12 hrs
    )
    parameters.add_str(
        variable_name="pipette_type",
        display_name="Pipette Type",
        description="Pipette model.",
        default="flex_96channel_1000",
        choices=PIPETTE_CHOICES,
    )
    parameters.add_str(
        variable_name="mount",
        display_name="Mount Location",
        description="Pipette mount location.",
        default="left",
        choices=MOUNT_CHOICES,
    )
    parameters.add_bool(
        display_name="Run Ramp Profile",
        variable_name="run_ramp_profile",
        description="Ramps the vacuum starting at -200 - -800.",
        default=True,
    )
    parameters.add_bool(
        display_name="Enable Waste Detection",
        variable_name="enable_waste_detection",
        description="Enables the waste detection mechanism.",
        default=False,
    )


def enable_waste_detection(vm_mod: VacuumModuleContext, enable: bool = False) -> None:
    """Hack: send M127 E0 via the driver. Not part of public PAPI."""
    core = cast(VacuumModuleCore, vm_mod._core)
    adapter = core._sync_module_hardware
    vacuum_hw = object.__getattribute__(adapter, "_obj_to_adapt")
    driver = vacuum_hw._driver

    SynchronousAdapter.call_coroutine_sync(
        vacuum_hw._loop,
        driver.set_waste_configs,
        enable_waste_full_detection=enable,
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    # Load Modules
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    # set the waste detection for vm mod
    enable_waste_detection(
        vm_mod,
        ctx.params.enable_waste_detection,  # type: ignore[attr-defined]
    )

    # Load Tipracks
    adapter = (
        "opentrons_flex_96_tiprack_adapter"
        if "flex_96channel" in ctx.params.pipette_type  # type: ignore[attr-defined]
        else None
    )
    tiprack_1000 = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "C1",
        adapter=adapter,
    )
    tiprack_200 = ctx.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "D1",
        adapter=adapter,
    )
    tiprack_50 = ctx.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        "D2",
        adapter=adapter,
    )

    # Load Labware
    manifold_collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]
    white_filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    black_flat_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "B2")
    deep_well_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "B1")
    reservoir_1 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C2")
    reservoir_2 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C3")

    # Manually set offsets
    tiprack_50.set_offset(x=0.00, y=0.00, z=0.00)
    tiprack_200.set_offset(x=0.00, y=0.00, z=0.00)
    tiprack_1000.set_offset(x=0.00, y=0.00, z=0.00)
    black_flat_plate.set_offset(x=0.00, y=0.00, z=0.00)
    deep_well_plate.set_offset(x=0.00, y=0.00, z=0.00)
    reservoir_1.set_offset(x=0.00, y=0.00, z=0.00)
    reservoir_2.set_offset(x=0.00, y=0.00, z=0.00)

    pipette_type = ctx.params.pipette_type  # type: ignore[attr-defined]
    step_tip_racks, instrument_tip_racks = _compatible_tip_racks(
        pipette_type, tiprack_50, tiprack_200, tiprack_1000
    )

    # Load Instruments + Trash
    pip = ctx.load_instrument(
        pipette_type,
        ctx.params.mount,  # type: ignore[attr-defined]
        tip_racks=instrument_tip_racks,
    )
    ctx.load_trash_bin("A1")

    # Protocol Start
    # ------------------------------------------------------
    ctx.home()

    # ------------------ Pipetting positional checks ----------------
    target_pressure = ctx.params.target_pressure  # type: ignore[attr-defined]
    hold_time = ctx.params.hold_time  # type: ignore[attr-defined]
    run_profile = ctx.params.run_ramp_profile  # type: ignore[attr-defined]
    for cycle in range(ctx.params.cycles):  # type: ignore[attr-defined]
        ctx.comment(f"Cycle #{cycle} at {target_pressure} mbar")

        # You can move the collar with the plate ontop from the dock to the module
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 50ul from reservoir2 onto filter plate
        pip.pick_up_tip(step_tip_racks[0])
        pip.aspirate(50, reservoir_2["A1"].bottom(z=5))
        pip.dispense(50, white_filter_plate.wells()[0].top())
        pip.return_tip()
        step_tip_racks[0].reset()

        # Close the vent and vacuum at -200 mbar for 30s, then open the vent
        # Note: The `start_set_vacuum_pressure` command is a concurrent module action
        # So you have to use another mechanism like ProtocolContext.delay or
        # ProtocolContext.wait_for_tasks if you want to WAIT for the vacuum
        # duration step to finish before continuing the protocol.
        vm_mod.close_vent()
        task1 = vm_mod.start_set_vacuum_pressure(
            target_pressure,
            hold_time,
            vent_after=True,
            equalize_timeout_s=30,
        )
        ctx.wait_for_tasks([task1])

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)  # type: ignore[attr-defined]
        # Move the black flat plate onto the vacuum module
        ctx.move_labware(black_flat_plate, vm_mod, use_gripper=True)
        black_flat_plate.set_offset(x=0.00, y=0.00, z=0.00)
        # Move collar with filter plate to the vacuum module base
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 50ul from reservoir1 onto filter plate
        pip.pick_up_tip(step_tip_racks[1])
        pip.aspirate(50, reservoir_1["A1"].bottom(z=5))
        pip.dispense(50, white_filter_plate.wells()[0].top())
        pip.return_tip()
        step_tip_racks[1].reset()

        # Close the vent run pump at 80% for N(s), and keep the vent closed
        vm_mod.close_vent()
        task2 = vm_mod.start_set_vacuum_power(80, hold_time, vent_after=False)

        ctx.wait_for_tasks([task2])
        # Manually open the vent and wait for pressure to equalize
        vm_mod.open_vent(equalize_timeout_s=30)

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)

        # Aspirate 50ul from the deep well onto the flat plate
        pip.pick_up_tip(step_tip_racks[2])
        pip.aspirate(50, deep_well_plate["A1"].bottom(z=5))
        pip.dispense(50, black_flat_plate.wells()[0].top())
        pip.return_tip()
        step_tip_racks[2].reset()

        # Move the black plate back to B2
        ctx.move_labware(black_flat_plate, "B2", use_gripper=True)

        # ⚠️ Stopping the vacuum module, note this automatically opens the vent
        vm_mod.stop_vacuum_pump()

        if run_profile:
            # ------------- Running profiles -------------
            vm_mod.close_vent()
            task3 = vm_mod.start_execute_profile(
                steps=[
                    {
                        "enable_pump": True,
                        "gauge_pressure_mbar": -200,
                        "hold_time_seconds": 10,
                        "vent_after": False,
                    },
                    {
                        "enable_pump": True,
                        "gauge_pressure_mbar": -300,
                        "hold_time_seconds": 20,
                        "vent_after": False,
                    },
                    {
                        "enable_pump": True,
                        "gauge_pressure_mbar": -500,
                        "hold_time_seconds": 40,
                        "vent_after": False,
                    },
                    {
                        "enable_pump": True,
                        "gauge_pressure_mbar": -800,
                        "hold_time_seconds": 120,
                        "vent_after": True,
                    },
                ],
                repetitions=1,
                vent_after=False,
            )
            ctx.wait_for_tasks([task3])

            # Turn off the pump after the profile is done.
            vm_mod.stop_vacuum_pump()
