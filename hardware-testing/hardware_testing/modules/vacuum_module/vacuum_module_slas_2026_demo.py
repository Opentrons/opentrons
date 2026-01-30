from opentrons.hardware_control.modules.types import VacuumModuleModel
from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Vacuum Module SLAS 2026 Demo",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

def run(ctx: ProtocolContext) -> None:
    """Protocol."""

    # Create a virtual vm if one does not exist
    vm = [m for m in ctx._hw_manager.hardware.attached_modules if m.serial_number == "VMA1020250119002"]
    if not vm:
        ctx._hw_manager.hardware.create_simulating_module(VacuumModuleModel.VACUUM_MODULE_V1, "VMA1020250119002")


    # Load Modules
    vm_mod  = ctx.load_module( module_name="vacuumModuleMilliporeV1", location="A3")
    abs_mod = ctx.load_module( module_name="absorbanceReaderV1", location="D3")
    abs_mod.open_lid()

    # Load Tipracks
    tiprack_1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul',  "C1", adapter='opentrons_flex_96_tiprack_adapter')
    tiprack_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul',  "D1", adapter='opentrons_flex_96_tiprack_adapter')

    # Load Labware
    manifold_collar =  vm_mod.load_adapter_to_dock('millipore_vacuum_manifold_collar_tall')
    white_filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    black_flat_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "C4", lid="opentrons_tough_universal_lid")
    reservoir_1 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C2")
    reservoir_2 = ctx.load_labware("opentrons_tough_1_reservoir_300ml", "C3")
    riser = ctx.load_adapter("opentrons_flex_deck_riser", "D2")
    lid_stack = riser.load_lid_stack("opentrons_tough_universal_lid", quantity=3)

    # Load Instruments + Trash
    pip = ctx.load_instrument('flex_96channel_1000', tip_racks=[tiprack_200, tiprack_1000])
    ctx.load_trash_bin("A1")

    # Protocol Start
    # ------------------------------------------------------
    ctx.home()
    ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

    # Aspirate 500ul with 1000ul tips from reservoir2 onto filter plate
    pip.pick_up_tip(tiprack_1000)
    pip.aspirate(500, reservoir_2["A1"])
    pip.move_to(reservoir_2.wells()[0].top())
    pip.dispense(500, white_filter_plate.wells()[0].top())
    pip.return_tip()

    # Turn on vacuum for 10s and vent after
    vm_mod.start_set_vacuum(pressure=-400, duration=10, vent_after=True)
    ctx.delay(10, msg="Start Vacuum -400 mbar for 10s")

    # Move the collar with filter plate to the dock
    vm_mod.move_to_dock(manifold_collar, use_gripper=True)

    # Remove the lid from the flat plate and move it into the vacuum module
    ctx.move_lid(black_flat_plate, lid_stack, use_gripper=True)
    ctx.move_labware(black_flat_plate, vm_mod, use_gripper=True,
        drop_offset={"x": 0, "y": 0, "z": -12}
     )

    # Move collar with filter plate back to the vacuum module base
    ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

    # Aspirate 150ul with 200ul tips from reservoir1 onto filter plate
    pip.pick_up_tip(tiprack_200)
    pip.aspirate(150, reservoir_1["A1"])
    pip.move_to(reservoir_1.wells()[0].top())
    pip.dispense(150, white_filter_plate.wells()[0].top())
    pip.return_tip()

    # Turn on vacuum for 10s and vent after
    vm_mod.start_set_vacuum(pressure=-400, duration=10, vent_after=True)
    ctx.delay(10, msg="Start Vacuum -400 mbar for 10s")

    # Move the collar with filter plate to the dock
    vm_mod.move_to_dock(manifold_collar, use_gripper=True)

    # Move the black flat plate from the vacuum module to the plate reader
    ctx.move_labware(black_flat_plate, abs_mod, use_gripper=True, 
        pick_up_offset={"x": 0, "y": 0, "z": -13},
    )
    abs_mod.close_lid()
    ctx.delay(10, msg="Taking Absorbance Reading...")
    abs_mod.open_lid()

    # Move the black flat plate from the absorbance reader to C4 and add lid
    ctx.move_labware(black_flat_plate, "C4", use_gripper=True)
    ctx.move_lid(lid_stack, black_flat_plate, use_gripper=True)

