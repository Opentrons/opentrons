"""Vacuum Module SLAS 2026 Demo Protocol."""
from typing import cast
from opentrons.hardware_control.modules.types import VacuumModuleModel
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    VacuumModuleContext,
    AbsorbanceReaderContext,
)


metadata = {
    "protocolName": "Vacuum Module SLAS 2026 Demo",
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


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    # Create a virtual vm if one does not exist
    vm = [
        m
        for m in ctx._hw_manager.hardware.attached_modules
        if m.serial_number == "VMA1020250119002"
    ]
    if not vm:
        ctx._hw_manager.hardware.create_simulating_module(
            VacuumModuleModel.VACUUM_MODULE_V1, "VMA1020250119002"
        )

    # Load Modules
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    abs_mod = cast(
        AbsorbanceReaderContext,
        ctx.load_module(module_name="absorbanceReaderV1", location="D3"),
    )
    abs_mod.open_lid()

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
    manifold_collar = ctx.load_adapter("millipore_vacuum_manifold_collar_tall", vm_mod.manifold_dock)  # type: ignore[attr-defined]

    white_filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    black_flat_plate = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "B2", lid="opentrons_tough_universal_lid"
    )
    deep_well_plate = ctx.load_labware(
        "nest_96_wellplate_2ml_deep", "C4", lid="opentrons_tough_universal_lid"
    )
    reservoir_1 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C2")
    reservoir_2 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C3")
    riser = ctx.load_adapter("opentrons_flex_deck_riser", "D2")
    lid_stack = riser.load_lid_stack("opentrons_tough_universal_lid", quantity=2)

    # Load Instruments + Trash
    pip = ctx.load_instrument(
        "flex_96channel_1000", tip_racks=[tiprack_200, tiprack_1000]
    )
    ctx.load_trash_bin("A1")

    # Run Time Parameters
    cycles = ctx.params.cycles  # type: ignore[attr-defined]

    # Protocol Start
    # ------------------------------------------------------
    for cycle in range(cycles):
        ctx.comment(f"Cycle #{cycle}")
        ctx.home()
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 500ul with 1000ul tips from reservoir2 onto filter plate
        pip.pick_up_tip(tiprack_1000)
        pip.aspirate(500, reservoir_2["A1"].bottom(z=5))
        pip.dispense(500, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_1000.reset()

        # Turn on vacuum for 30s and vent after
        vm_mod.close_vent()
        vm_mod.start_set_vacuum_pressure(-400, 30, vent_after=True)
        ctx.delay(30, msg="Start Vacuum -400 mbar for 30s")

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)  # type: ignore[attr-defined]

        # Remove the lids from the flat and deep well plates
        ctx.move_lid(black_flat_plate, lid_stack, use_gripper=True)
        ctx.move_lid(deep_well_plate, lid_stack, use_gripper=True)
        # Move the deep well plate into the vacuum module
        ctx.move_labware(deep_well_plate, vm_mod, use_gripper=True)

        # Move collar with filter plate back to the vacuum module base
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

        # Aspirate 150ul with 200ul tips from reservoir1 onto filter plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, reservoir_1["A1"].bottom(z=5))
        pip.dispense(150, white_filter_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # Turn on vacuum for 30s and vent after
        vm_mod.close_vent()
        vm_mod.start_set_vacuum_pressure(-400, 30, vent_after=True)
        ctx.delay(30, msg="Start Vacuum -400 mbar for 30s")

        # Move the collar with filter plate to the dock
        ctx.move_labware(manifold_collar, "A2", use_gripper=True)

        # Aspirate 150ml from the deep well onto the flat plate
        pip.pick_up_tip(tiprack_200)
        pip.aspirate(150, deep_well_plate["A1"].bottom(z=5))
        pip.dispense(150, black_flat_plate.wells()[0].top())
        pip.return_tip()
        tiprack_200.reset()

        # Move the flat plate to the absorbance reader
        ctx.move_labware(black_flat_plate, abs_mod, use_gripper=True)
        abs_mod.close_lid()
        ctx.delay(10, msg="Taking Absorbance Reading...")
        abs_mod.open_lid()

        # Move the flat plate from the absorbance reader to B2 and add lid
        ctx.move_labware(black_flat_plate, "B2", use_gripper=True)
        ctx.move_lid(lid_stack, black_flat_plate, use_gripper=True)

        # Move the deep well plate to C4 and add lid
        ctx.move_labware(deep_well_plate, "C4", use_gripper=True)
        ctx.move_lid(lid_stack, deep_well_plate, use_gripper=True)
