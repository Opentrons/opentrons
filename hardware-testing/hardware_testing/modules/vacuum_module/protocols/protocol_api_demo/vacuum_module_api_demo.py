"""Vacuum Module PAPI Demo Protocol."""
from typing import cast
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    VacuumModuleContext,
)


metadata = {
    "protocolName": "Vacuum Module Opentrons API Demo",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}


"""

# --------------------Vacuum Module API --------------------

apiLevel: 2.30

1.
    vm_mod.close_vent()
    # Closes the vent, this should run first if you intend to go under vacuum
2.
    task = vm_mod.start_set_vacuum_pressure(-400, 30, vent_after=True)

    # Concurrent command to set the vacuum gauge pressure
    # pressure: -800 - 0: The lower the number the higher the pressure
    # duration: 1-3500: Time in seconds to hold the given pressure, indefinte if None
    # timeout:  1-3500: Time in seconds to raise timeout error if we havent reached pressure / power.
                        Only works if `duration` is provided
    # vent_after: Close / Open the vent AFTER the duration timeout

    # Concurrent command to the set vacuum pressure
    # Can be used with ctx.wait_for_tasks to block until one of the conditions are met
    # 1. If the `duration` is provided, this will block until the duration is experired.
    # 2. If the `duration` is not provided, this will block until the target pressure or power are reached
    # 3. An error (ie, pressure timeout) occured while waiting on the above conditions

3.
    task = vm_mod.start_set_vacuum_power(50)

    # Concurrent command to the set vacuum power percentage, same args as start_set_vacuum_pressure
    # Can be used with ctx.wait_for_tasks to block until one of the conditions are met
    # 1. If the `duration` is provided, this will block until the duration is experired.
    # 2. If the `duration` is not provided, this will block until the target pressure or power are reached
    # 3. An error (ie, pressure timeout) occured while waiting on the above conditions

4.
    vm_mod.open_vent()
    # Open the vent

5.
    vm_mod.stop_vacuum_pump()
    # Stops the vacuum pump and opens the vent

6.
    task1 = vm_mod.start_execute_profile(
        steps = [
            {
                "enable_pump": True,
                "gauge_pressure_mbar": -100,
                "hold_time_seconds": 30,
                "vent_after": False
            },
            {
                "enable_pump": True,
                "percent_power": 30,
            }
        ],
        repetitions=2,
        vent_after=True
    )

    # Concurrent command to run profiles, args are same as `start_set_vacuum_pressure`
    # and `start_set_vacuum_power`.
    # You can set the vent state after every step, but you can also set the
    # final vent state with outter `vent_after` arg.
    # Note: When running concurently this will wait `hold_time_seconds` and
    # `hold_time_minutes` if provided OR target pressure/power before moving
    # on to the next step.
    #
    # ⚠️ NOTE: If you want to WAIT for the profile to finish before moving
    # on to the next protocol command, then use the `ProtocolContext.wait_for_tasks`
    # api as seen below.
    #
    # ctx.wait_for_tasks([task1])

--------------------Vacuum Module API --------------------

"""


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
    parameters.add_bool(
        display_name="Enable Confirm Position",
        variable_name="enable_position_confirm",
        description="Pause the protocol to visually inspect pipette position with different labware stackups.",
        default=False,
    )


def confirm_position(ctx: ProtocolContext) -> None:
    """Pause the protocol if enable_position_confirm is True."""
    if ctx.params.enable_position_confirm:  # type: ignore[attr-defined]
        ctx.pause("Checking pipette position above well.")


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
        "flex_1channel_1000", "left", tip_racks=[tiprack_200, tiprack_1000]
    )
    ctx.load_trash_bin("A1")

    # Protocol Start
    # ------------------------------------------------------
    ctx.home()

    # ------------------ Pipetting positional checks ----------------
    for cycle in range(ctx.params.cycles):  # type: ignore[attr-defined]
        ctx.comment(f"Cycle #{cycle}")
        # Baseline:
        # B2: Deck + Flat plate
        pip.pick_up_tip(tiprack_1000)
        pip.move_to(black_flat_plate["A1"].top())
        confirm_position(ctx)

        # A3: Deck + Module + Flat plate
        # A4: Deck + Dock + Collar + Filter plate
        ctx.move_labware(black_flat_plate, vm_mod, use_gripper=True)
        pip.move_to(black_flat_plate["A1"].top())
        confirm_position(ctx)

        # A3: Deck + Module + Flat plate + Filter plate
        # A4: Deck + Dock + Collar
        ctx.move_labware(white_filter_plate, black_flat_plate, use_gripper=True)
        pip.move_to(white_filter_plate["A1"].top())
        confirm_position(ctx)

        # A3: Deck + Module + Flat plate + Filter plate + Collar
        # A4: Deck + Dock
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
        pip.move_to(white_filter_plate["A1"].top())
        confirm_position(ctx)

        # Unstacking
        # A3: Deck + Module + Flat plate + Filter plate
        # A4: Deck + Dock + Collar
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)
        # A3: Deck + Module + Flat plate
        # A4: Deck + Dock + Collar + Filter plate
        ctx.move_labware(white_filter_plate, manifold_collar, use_gripper=True)
        # A3: Deck + Module + Flat plate + Collar + Filter plate
        # A4: Deck + Dock
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
        pip.move_to(white_filter_plate["A1"].top())
        confirm_position(ctx)

        # A3: Deck + Module + Flat plate
        # A4: Deck + Dock + Collar + Filter plate
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)
        ctx.move_labware(black_flat_plate, "B2", use_gripper=True)
        pip.return_tip()

        # ------------------ Pipetting positional checks ----------------

        # ------------------ Vacuum Module API Demo  --------------------

        # You can move the collar with the plate ontop from the dock to the module
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 500ul with 1000ul tips from reservoir2 onto filter plate
        pip.pick_up_tip(tiprack_1000)
        pip.aspirate(500, reservoir_2["A1"].bottom(z=5))
        pip.dispense(500, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_1000.reset()

        # Close the vent and vacuum at -400 mbar for 30s, then open the vent
        # Note: The `start_set_vacuum_pressure` command is a concurrent module action
        # So you have to use another mechanism like ProtocolContext.delay or
        # ProtocolContext.wait_for_tasks if you
        # want to WAIT for the vacuum step to finish before continuing.
        vm_mod.close_vent()
        task1 = vm_mod.start_set_vacuum_pressure(-400, 30, vent_after=True)
        ctx.wait_for_tasks([task1])

        # Move the collar with filter plate to the dock
        # ‼️ NOTE: The vacuum module has 2 locations
        # - vm_mod -> main location
        # - vm_mod.manifold_dock -> dock location
        # You can use the .manifold_dock to address the dock location for moving, etc
        # Like usual you need the `use_gripper=True` if to move the collar with the gripper
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)  # type: ignore[attr-defined]

        # ‼️ NOTE: New Containment behavior
        # Modules / Labware can now share multiple children in the same location
        # As long as their geometries dont collide.
        #
        # Below we move the `black_flat_plate` ontop of the vacuum module
        # Then we move the `manifold_collar` ontop of the vacuuum module
        # Since there is space within the `collar`, the `black_flat_plate`
        # does not collide with the collar and is considered `contained` by the collar.

        # Move the black flat plate onto the vacuum module
        ctx.move_labware(black_flat_plate, vm_mod, use_gripper=True)
        # Move collar with filter plate to the vacuum module base
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
        # The above action would have failed before, since the `black_flat_plate`
        # would have occupied the `vm_mod` location, it now is acceptable because
        # of containment. Therefore the `vm_mod` now has multiple `children` and
        # conversely the children now have the same `parent`.

        # Aspirate 150ul with 200ul tips from reservoir1 onto filter plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, reservoir_1["A1"].bottom(z=5))
        pip.dispense(150, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # Close the vent and run the vacuum at 80% for 30s, and keep the vent closed
        vm_mod.close_vent()
        task2 = vm_mod.start_set_vacuum_power(80, 30, vent_after=False)
        ctx.wait_for_tasks([task2])
        # Manually open the vent
        vm_mod.open_vent()

        # ⚠️ Stopping the vacuum module, note this automatically opens the vent
        vm_mod.stop_vacuum_pump()

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)

        # Aspirate 150ml from the deep well onto the flat plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, deep_well_plate["A1"].bottom(z=5))
        pip.dispense(150, black_flat_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # Move plate back to original position
        ctx.move_labware(black_flat_plate, "B2", use_gripper=True)

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
                    "hold_time_seconds": 10,
                    "vent_after": False,
                },
                {
                    "enable_pump": True,
                    "gauge_pressure_mbar": -500,
                    "hold_time_seconds": 10,
                    "vent_after": False,
                },
                {
                    "enable_pump": True,
                    "gauge_pressure_mbar": -800,
                    "hold_time_seconds": 10,
                    "vent_after": True,
                },
            ],
            repetitions=1,
            vent_after=False,
        )
        ctx.wait_for_tasks([task1])

        # Turn off the pump after the profile is done
        vm_mod.stop_vacuum_pump()
