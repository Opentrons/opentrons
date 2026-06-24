"""Vacuum Module QC Protocol."""
from typing import cast
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    VacuumModuleContext,
)


metadata = {
    "protocolName": "Vacuum Module DVT QC Protocol V0.1",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}


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
                "value": "millipore_vacuum_manifold_collar_tall",
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
        default=30,
        minimum=1,
        maximum=60 * 60 * 12,  # 12 hrs
    )
    parameters.add_bool(
        display_name="Run Ramp Profile",
        variable_name="run_ramp_profile",
        description="Ramps the vacuum starting at -200 - -800.",
        default=True,
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    # Load Modules
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )

    # Load Tipracks
    tiprack_1000 = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "C1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tiprack_200 = ctx.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "D1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )

    # Load Labware
    manifold_collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]
    white_filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    black_flat_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "B2")
    deep_well_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "B1")
    reservoir_1 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C2")
    reservoir_2 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C3")

    # Load Instruments + Trash
    pip = ctx.load_instrument(
        "flex_96channel_1000", "left", tip_racks=[tiprack_200, tiprack_1000]
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

        # Aspirate 500ul with 1000ul tips from reservoir2 onto filter plate
        pip.pick_up_tip(tiprack_1000)
        pip.aspirate(500, reservoir_2["A1"].bottom(z=5))
        pip.dispense(500, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_1000.reset()

        # Close the vent and vacuum at -200 mbar for 30s, then open the vent
        # Note: The `start_set_vacuum_pressure` command is a concurrent module action
        # So you have to use another mechanism like ProtocolContext.delay or
        # ProtocolContext.create_timer + ProtocolContext.wait_for_tasks if you
        # want to WAIT for the vacuum step to finish before continuing.
        vm_mod.close_vent()
        vm_mod.start_set_vacuum_pressure(target_pressure, hold_time, vent_after=True)
        ctx.delay(
            hold_time, msg=f"Start Vacuum {target_pressure} mbar for {hold_time}s"
        )

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)  # type: ignore[attr-defined]
        # Move the black flat plate onto the vacuum module
        ctx.move_labware(black_flat_plate, vm_mod, use_gripper=True)
        # Move collar with filter plate to the vacuum module base
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 150ul with 200ul tips from reservoir1 onto filter plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, reservoir_1["A1"].bottom(z=5))
        pip.dispense(150, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # Close the vent and vacuum at -200 mbar for 30s, and keep the vent closed
        vm_mod.close_vent()
        vm_mod.start_set_vacuum_pressure(target_pressure, hold_time, vent_after=False)
        ctx.delay(
            hold_time, msg=f"Start Vacuum {target_pressure} mbar for {hold_time}s"
        )
        # Manually open the vent
        vm_mod.open_vent()

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)

        # Aspirate 150ml from the deep well onto the flat plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, deep_well_plate["A1"].bottom(z=5))
        pip.dispense(150, black_flat_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # ⚠️ Stopping the vacuum module, note this automatically opens the vent
        vm_mod.stop_vacuum_pump()

        if run_profile:
            # ------------- Running profiles -------------
            vm_mod.close_vent()
            task1 = vm_mod.start_execute_profile(
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
            )
            ctx.wait_for_tasks([task1])

            # Turn off the pump after the profile is done
            vm_mod.stop_vacuum_pump()
