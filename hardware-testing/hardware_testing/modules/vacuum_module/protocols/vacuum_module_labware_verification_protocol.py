"""Verify vacuum module loading for filter plates, receiver plates, and collar variants."""
from typing import List, cast

from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    VacuumModuleContext,
)
from opentrons.protocols.parameters.types import ParameterChoice

metadata = {
    "protocolName": "Vacuum Module Labware Loading Verification",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": (
        "Gripper-based loading checks for filter plates on vacuum module collars, "
        "filter plates stacked on receiver well plates, and receiver plates on the module."
    ),
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}

COLLAR_CHOICES: List[ParameterChoice] = [
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
]

FILTER_PLATE_CHOICES: List[ParameterChoice] = [
    {
        "display_name": "Millipore 96 300µL Classic",
        "value": "millipore_96_wellplate_300ul_filter",
    },
    {
        "display_name": "Millipore 96 300µL HTS",
        "value": "millipore_96_wellplate_300ul_hts_filter",
    },
    {
        "display_name": "Millipore 96 300µL PCR",
        "value": "millipore_96_wellplate_300ul_pcr_filter",
    },
    {
        "display_name": "Millipore 96 500µL Ultracel",
        "value": "millipore_96_wellplate_500ul_ultracel_filter",
    },
    {
        "display_name": "Millipore 96 500µL Solvinert",
        "value": "millipore_96_wellplate_500ul_solvinet_filter",
    },
    {
        "display_name": "Millipore 384 100µL Filter",
        "value": "millipore_384_wellplate_100ul_filter",
    },
    {
        "display_name": "Nunc 96 1000µL Filter",
        "value": "thermoscientificnunc_96_wellplate_1000ul_filter",
    },
    {
        "display_name": "Cytiva AcroPrep 96 350µL Filter",
        "value": "cytiva_96_wellplate_350ul_filter",
    },
    {
        "display_name": "Cytiva AcroPrep 96 1000µL NAB Long Tip",
        "value": "cytiva_96_wellplate_1000ul_longtip_filter",
    },
    {
        "display_name": "Luna Nanotech USP-096F 1000µL Silica",
        "value": "lunanano_96_wellplate_1000ul_filter",
    },
    {
        "display_name": "InVitroVen Filter",
        "value": "invitroven_filter_plate",
    },
]

RECEIVER_PLATE_CHOICES: List[ParameterChoice] = [
    {
        "display_name": "Millipore 96 400µL",
        "value": "millipore_96_wellplate_400ul",
    },
    {
        "display_name": "Corning 96 360µL Flat",
        "value": "corning_96_wellplate_360ul_flat",
    },
    {
        "display_name": "NEST 96 2mL Deep",
        "value": "nest_96_wellplate_2ml_deep",
    },
    {
        "display_name": "Nunc 96 1300µL Deep",
        "value": "thermoscientificnunc_96_wellplate_1300ul",
    },
    {
        "display_name": "Millipore 24 800µL",
        "value": "millipore_24_wellplate_800ul",
    },
    {
        "display_name": "Corning 384 112µL Flat",
        "value": "corning_384_wellplate_112ul_flat",
    },
]


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="Manifold collar on the vacuum module dock.",
        default="opentrons_vacuum_manifold_collar_short",
        choices=COLLAR_CHOICES,
    )
    parameters.add_str(
        variable_name="filter_plate",
        display_name="Filter Plate",
        description="Filter plate loaded on the collar.",
        default="millipore_96_wellplate_300ul_hts_filter",
        choices=FILTER_PLATE_CHOICES,
    )
    parameters.add_str(
        variable_name="receiver_plate",
        display_name="Receiver Plate",
        description="Receiver plate moved onto the vacuum module.",
        default="millipore_96_wellplate_400ul",
        choices=RECEIVER_PLATE_CHOICES,
    )
    parameters.add_bool(
        variable_name="enable_position_confirm",
        display_name="Position Confirm",
        description="Pause for visual pipette position checks.",
        default=False,
    )
    parameters.add_bool(
        variable_name="run_receiver_only_check",
        display_name="Receiver Only",
        description="Move receiver plate onto the vacuum module.",
        default=True,
    )
    parameters.add_bool(
        variable_name="run_filter_on_collar_check",
        display_name="Filter on Collar",
        description="Move collar and filter on the module.",
        default=True,
    )
    parameters.add_bool(
        variable_name="run_filter_on_receiver_check",
        display_name="Filter on Receiver",
        description="Stack filter plate on receiver on module.",
        default=True,
    )
    parameters.add_bool(
        variable_name="run_containment_stack_check",
        display_name="Containment Stack",
        description="Receiver contained under collar and filter.",
        default=True,
    )


def _confirm_position(ctx: ProtocolContext) -> None:
    if ctx.params.enable_position_confirm:  # type: ignore[attr-defined]
        ctx.pause("Inspect pipette position above the well.")


def run(ctx: ProtocolContext) -> None:
    """Verify labware can be loaded on the vacuum module."""
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    ctx.load_trash_bin("A1")

    tiprack = ctx.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "C1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    pip = ctx.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack])

    collar_load_name = ctx.params.collar  # type: ignore[attr-defined]
    filter_load_name = ctx.params.filter_plate  # type: ignore[attr-defined]
    receiver_load_name = ctx.params.receiver_plate  # type: ignore[attr-defined]

    manifold_collar = vm_mod.load_adapter_to_dock(collar_load_name)
    filter_plate = manifold_collar.load_labware(filter_load_name)
    receiver_plate = ctx.load_labware(receiver_load_name, "B1")

    sample = ctx.define_liquid(
        name="Water",
        description="Dummy liquid for position checks",
        display_color="#0088FF",
    )
    filter_plate.wells()[0].load_liquid(liquid=sample, volume=100)
    receiver_plate.wells()[0].load_liquid(liquid=sample, volume=100)

    ctx.home()
    ctx.comment(
        f"Verifying collar={collar_load_name}, "
        f"filter={filter_load_name}, receiver={receiver_load_name}"
    )

    if ctx.params.run_receiver_only_check:  # type: ignore[attr-defined]
        ctx.comment("Check: receiver well plate on vacuum module")
        ctx.move_labware(receiver_plate, vm_mod, use_gripper=True)
        pip.pick_up_tip(tiprack)
        pip.move_to(receiver_plate.wells()[0].top())
        _confirm_position(ctx)
        pip.return_tip()
        ctx.move_labware(receiver_plate, "B1", use_gripper=True)

    if ctx.params.run_filter_on_collar_check:  # type: ignore[attr-defined]
        ctx.comment("Check: filter plate on collar between dock and module")
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
        pip.pick_up_tip(tiprack)
        pip.move_to(filter_plate.wells()[0].top())
        _confirm_position(ctx)
        pip.return_tip()
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)

    if ctx.params.run_filter_on_receiver_check:  # type: ignore[attr-defined]
        ctx.comment("Check: filter plate stacked on receiver on vacuum module")
        ctx.move_labware(receiver_plate, vm_mod, use_gripper=True)
        ctx.move_labware(filter_plate, receiver_plate, use_gripper=True)
        pip.pick_up_tip(tiprack)
        pip.move_to(filter_plate.wells()[0].top())
        _confirm_position(ctx)
        pip.return_tip()
        ctx.move_labware(filter_plate, manifold_collar, use_gripper=True)
        ctx.move_labware(receiver_plate, "B1", use_gripper=True)

    if ctx.params.run_containment_stack_check:  # type: ignore[attr-defined]
        ctx.comment("Check: receiver contained under collar + filter on vacuum module")
        ctx.move_labware(receiver_plate, vm_mod, use_gripper=True)
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
        pip.pick_up_tip(tiprack)
        pip.move_to(filter_plate.wells()[0].top())
        _confirm_position(ctx)
        pip.return_tip()
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True)
        ctx.move_labware(receiver_plate, "B1", use_gripper=True)

    ctx.comment(
        "Labware loading verification complete for "
        f"{filter_load_name} on {collar_load_name}."
    )
