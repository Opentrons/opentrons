"""Reverse companion for IDT xGen 200 uL 96-channel v9.

Water-only ABR: mixed waste is recoverable. Recovers post-cleanup residuals,
restores starting volumes from liquid waste, and resets movable labware for
automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api import OFF_DECK
from opentrons.protocol_api.module_contexts import FlexStackerContext

metadata = {
    "protocolName": "Reverse IDT xGen 200 uL 96x v9",
    "author": "Opentrons",
    "description": "Recover post-cleanup residuals and reset movable labware.",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Mirror the original runtime-parameter interface."""
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        default=True,
    )
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        default=False,
    )
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        default=0.5,
        minimum=0.0,
        maximum=1.0,
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )
    parameters.add_str(
        display_name="Frag Mode",
        variable_name="FRAG_MODE",
        default="MC",
        choices=[
            {"display_name": "MC", "value": "MC"},
            {"display_name": "EZ", "value": "EZ"},
        ],
    )
    parameters.add_int(
        display_name="Enz Frag Time (Min)",
        variable_name="FRAGTIME",
        default=20,
        minimum=10,
        maximum=60,
    )
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,
        minimum=1,
        maximum=20,
    )


def _load_off_deck_racks(
    protocol: protocol_api.ProtocolContext, load_name: str, count: int
) -> list[protocol_api.Labware]:
    """Represent retained racks that the original leaves off deck."""
    return [
        protocol.load_labware(load_name=load_name, location=OFF_DECK)
        for _ in range(count)
    ]


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Recover addressable residuals, then restore original labware locations."""
    protocol.comment(
        "FRAG_MODE, FRAGTIME, PCRCYCLES, and dry_run change incubation details "
        "but not the completed end-state reset performed here."
    )

    thermocycler = protocol.load_module("thermocycler module gen2")
    temp_module = protocol.load_module("temperature module gen2", "C1")
    reagent_plate_1 = temp_module.load_labware("greiner_384_wellplate_240ul")
    protocol.load_labware("greiner_384_wellplate_240ul", "B3")
    liquid_waste = protocol.load_labware("nest_96_wellplate_2ml_deep", "B2")
    protocol.load_labware("nest_96_wellplate_2ml_deep", "C2")
    protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", "C3", 4)

    mag_block = protocol.load_module("magneticBlockV1", "D2")
    cleanup_plate_2 = mag_block.load_labware(
        "nest_96_wellplate_2ml_deep", label="Cleanup Plate 2 end state"
    )
    cleanup_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        OFF_DECK,
        "Cleanup Plate 1 retained off deck",
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

    adapters = [
        protocol.load_adapter("opentrons_flex_96_tiprack_adapter", slot)
        for slot in ("A2", "A3")
    ]
    end_rack_a2 = adapters[0].load_labware("opentrons_flex_96_tiprack_50ul")
    end_rack_a3 = adapters[1].load_labware("opentrons_flex_96_tiprack_50ul")
    pipette = protocol.load_instrument(
        "flex_96channel_200", "left", tip_racks=[end_rack_a2]
    )

    stacker_200: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "B4"
    )  # type: ignore[assignment]
    stacker_200.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=0)
    stacker_50: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "C4"
    )  # type: ignore[assignment]
    stacker_50.set_stored_labware("opentrons_flex_96_tiprack_50ul", count=1)

    retrieved_200_racks = _load_off_deck_racks(
        protocol, "opentrons_flex_96_tiprack_200ul", 6
    )
    retrieved_50_racks = _load_off_deck_racks(
        protocol, "opentrons_flex_96_tiprack_50ul", 3
    )
    original_50_racks = _load_off_deck_racks(
        protocol, "opentrons_flex_96_tiprack_50ul", 2
    )

    residual = protocol.define_liquid(
        name="Post-cleanup residual",
        description="Remaining water after forward cleanup.",
        display_color="#52AAFF",
    )
    for well in cleanup_plate_2.wells():
        well.load_liquid(liquid=residual, volume=12)
    for well in cleanup_plate_1.wells():
        well.load_liquid(liquid=residual, volume=2)
    rsb_source = reagent_plate_1["B2"]
    rsb_source.load_liquid(liquid=residual, volume=0)

    protocol.move_labware(cleanup_plate_2, "D1", use_gripper=True)
    protocol.move_labware(cleanup_plate_1, "D3", use_gripper=False)
    pipette.pick_up_tip()
    pipette.aspirate(12, cleanup_plate_2["A1"])
    pipette.dispense(12, rsb_source)
    pipette.aspirate(2, cleanup_plate_1["A1"])
    pipette.dispense(2, rsb_source)

    protocol.move_labware(cleanup_plate_2, "D4", use_gripper=True)
    protocol.move_labware(cleanup_plate_1, mag_block, use_gripper=True)
    protocol.move_labware(sample_plate_2, "A4", use_gripper=False)
    thermocycler.open_lid()
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
    water = protocol.define_liquid(
        "Water",
        description="ABR fleet water; mixed waste is recoverable.",
        display_color="#C0C0C0",
    )
    pipette.aspirate(4.33, liquid_waste["A1"])
    pipette.dispense(4.33, reagent_plate_1["A1"])
    pipette.aspirate(2.0, liquid_waste["A1"])
    pipette.dispense(2.0, sample_plate_1["A1"])
    for well in sample_plate_2.wells():
        well.load_liquid(water, 2.0)
    pipette.return_tip()

    protocol.comment("Recovered residuals and bulk starting volumes from waste.")

    for rack in retrieved_200_racks:
        protocol.move_labware(rack, stacker_200, use_gripper=False)
        stacker_200.store()

    for rack in (end_rack_a2, end_rack_a3):
        protocol.move_labware(rack, stacker_50, use_gripper=True)
        stacker_50.store()
    for rack in retrieved_50_racks:
        protocol.move_labware(rack, stacker_50, use_gripper=False)
        stacker_50.store()

    for rack, adapter in zip(original_50_racks, adapters):
        protocol.move_labware(rack, adapter, use_gripper=False)

    if protocol.params.deactivate_modules:  # type: ignore[attr-defined]
        thermocycler.deactivate_block()
        thermocycler.deactivate_lid()
        temp_module.deactivate()

    pipette.reset_tipracks()
    protocol.comment(
        "Plate locations and stacker counts match forward start. Rerun original."
    )
