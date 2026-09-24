"""Reverse companion for the Illumina RNA all-parts protocol.

Water-only ABR: mixed waste is recoverable. Reverses final elution transfers,
restores starting volumes from the liquid-waste reservoir, and resets movable
labware for automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api import OFF_DECK
from opentrons.protocol_api.module_contexts import FlexStackerContext

metadata = {
    "protocolName": "Reverse Illumina RNA Enrichment 96x All Parts",
    "author": "Opentrons",
    "description": "Recover post-cleanup liquid and reset movable labware.",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Mirror the original runtime-parameter interface."""
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Mirrored for compatibility; original overrides this to True.",
    )
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,
        minimum=1,
        maximum=12,
        description="Mirrored; the original amplification profile uses 12 cycles.",
    )
    parameters.add_str(
        display_name="Protocol Steps",
        variable_name="PROTOCOL_STEPS",
        default="All Steps",
        choices=[
            {"display_name": "All Steps", "value": "All Steps"},
            {"display_name": "cDNA and Library Prep", "value": "cDNA and Library Prep"},
            {"display_name": "Just cDNA", "value": "Just cDNA"},
            {"display_name": "Just Library Prep", "value": "Just Library Prep"},
            {
                "display_name": "Pooling and Hybridization",
                "value": "Pooling and Hybridization",
            },
            {"display_name": "Just Pooling", "value": "Just Pooling"},
            {"display_name": "Just Hybridization", "value": "Just Hybridization"},
            {"display_name": "Just Capture", "value": "Just Capture"},
        ],
        description="Mirrored; the original overrides this to All Steps.",
    )
    parameters.add_bool(
        display_name="Temperature Module",
        variable_name="temperature_module",
        default=True,
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Reverse recoverable final transfers and restore original plate layout."""
    protocol.comment(
        "DRYRUN, PCRCYCLES, and PROTOCOL_STEPS do not alter this reset because "
        "the original overrides/ignores them in its executed path."
    )

    thermocycler = protocol.load_module("thermocycler module gen2")
    sample_plate_3 = thermocycler.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "Sample Plate 3 end state",
    )
    sample_plate_1 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        OFF_DECK,
        "Sample Plate 1 retained off deck",
    )
    sample_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        OFF_DECK,
        "Sample Plate 2 retained off deck",
    )

    protocol.load_labware("greiner_384_wellplate_240ul", "B2", "Reagent Plate 2")
    if protocol.params.temperature_module:  # type: ignore[attr-defined]
        temp_module = protocol.load_module("temperature module gen2", "C1")
        reagent_plate_1 = temp_module.load_labware(
            "greiner_384_wellplate_240ul", "Reagent Plate 1"
        )
    else:
        temp_module = None
        reagent_plate_1 = protocol.load_labware(
            "greiner_384_wellplate_240ul", "C1", "Reagent Plate 1"
        )

    protocol.load_labware("nest_96_wellplate_2ml_deep", "C3", "ETOH Reservoir")
    liquid_waste = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "D1", "Liquid Waste Reservoir"
    )
    protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", "B3", 5)

    mag_block = protocol.load_module("magneticBlockV1", "D2")
    cleanup_plate_2 = mag_block.load_labware(
        "nest_96_wellplate_2ml_deep", "Cleanup Plate 2 end state"
    )
    cleanup_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        OFF_DECK,
        "Cleanup Plate 1 retained off deck",
    )

    stacker_20_used: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "A4"
    )  # type: ignore[assignment]
    stacker_20_used.set_stored_labware(
        "opentrons_flex_96_tiprack_20ul", count=0
    )
    stacker_20_source: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "B4"
    )  # type: ignore[assignment]
    stacker_20_source.set_stored_labware(
        "opentrons_flex_96_tiprack_20ul", count=6
    )
    stacker_50_used: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "C4"
    )  # type: ignore[assignment]
    stacker_50_used.set_stored_labware(
        "opentrons_flex_96_tiprack_50ul", count=0
    )
    stacker_50_source: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "D4"
    )  # type: ignore[assignment]
    stacker_50_source.set_stored_labware(
        "opentrons_flex_96_tiprack_50ul", count=6
    )

    tiprack_a3 = protocol.load_labware(
        "opentrons_flex_96_tiprack_20ul",
        "A3",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tiprack_c2 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        "C2",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    pipette = protocol.load_instrument(
        "flex_96channel_200", "left", tip_racks=[tiprack_c2]
    )

    recovered = protocol.define_liquid(
        name="Final mixed library",
        description="Addressable liquid present at the original end state.",
        display_color="#52AAFF",
    )
    for well in sample_plate_3.wells():
        well.load_liquid(liquid=recovered, volume=36)
    for well in cleanup_plate_2.wells():
        well.load_liquid(liquid=recovered, volume=69)
    rsb_source = reagent_plate_1["A1"]
    rsb_source.load_liquid(liquid=recovered, volume=0)

    thermocycler.open_lid()
    pipette.pick_up_tip()
    pipette.aspirate(31, sample_plate_3["A1"])
    pipette.dispense(31, cleanup_plate_2["A1"])
    pipette.aspirate(32, cleanup_plate_2["A1"])
    pipette.dispense(32, rsb_source)

    protocol.comment(
        "Reversed the final 31 uL elution transfer and the preceding 32 uL RSB addition."
    )

    protocol.move_labware(cleanup_plate_2, stacker_50_source, use_gripper=True)
    protocol.move_labware(cleanup_plate_1, mag_block, use_gripper=False)
    protocol.move_labware(sample_plate_3, "A2", use_gripper=True)
    protocol.move_labware(sample_plate_2, sample_plate_3, use_gripper=False)
    protocol.move_labware(sample_plate_1, thermocycler, use_gripper=False)

    liquid_waste["A1"].load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward cleanup output; recoverable for ABR water runs.",
            display_color="#9B9B9B",
        ),
        50000,
    )
    protocol.comment("Recovering remaining starting water from liquid waste.")
    for plate, volume in [
        (sample_plate_1, 2.0),
        (sample_plate_2, 2.0),
        (reagent_plate_1, 4.33),
    ]:
        pipette.aspirate(volume, liquid_waste["A1"])
        pipette.dispense(volume, plate["A1"])
    pipette.return_tip()

    if temp_module is not None:
        temp_module.deactivate()
    thermocycler.deactivate_block()
    thermocycler.deactivate_lid()

    pipette.reset_tipracks()
    protocol.comment(
        "Deck layout matches forward start. Rerun original."
    )
