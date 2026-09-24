"""Reverse/reset companion for 11_IDT xGen 1000 ul 96ch.py.

Water-only ABR: mixed waste is recoverable. Reverses recoverable liquid and
labware moves, restores remaining starting volumes from waste, and resets
stacker inventories for automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api import OFF_DECK
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
    MagneticBlockContext,
    TemperatureModuleContext,
    ThermocyclerContext,
)


metadata = {
    "protocolName": "Reverse IDT xGen 96x v9",
    "author": "Opentrons",
    "source": "Reverse companion",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Mirror the original protocol's runtime parameter interface."""
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="If Dry Run is True, skip incubation.",
        default=False,
    )
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        description="Lowest value pipette will go to.",
        default=0.5,
        choices=[
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "0.1", "value": 0.1},
            {"display_name": "0.2", "value": 0.2},
            {"display_name": "0.3", "value": 0.3},
            {"display_name": "0.4", "value": 0.4},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "0.6", "value": 0.6},
            {"display_name": "0.7", "value": 0.7},
            {"display_name": "0.8", "value": 0.8},
            {"display_name": "0.9", "value": 0.9},
            {"display_name": "1.0", "value": 1.0},
        ],
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )
    parameters.add_str(
        display_name="Frag Mode",
        variable_name="FRAG_MODE",
        default="MC",
        description="Use the same branch as the completed original run.",
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
        description="Retained for compatibility with the original run.",
    )
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,
        minimum=1,
        maximum=20,
        description="Retained for compatibility with the original run.",
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Reverse recoverable liquid and labware moves in dependency order."""
    deactivate_modules = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    frag_mode = protocol.params.FRAG_MODE  # type: ignore[attr-defined]

    p1000 = protocol.load_instrument("flex_96channel_1000", "left")

    stacker_200: FlexStackerContext = protocol.load_module(  # type: ignore[assignment]
        "flexStackerModuleV1", "B4"
    )
    # End state: all six originally stored 200 uL racks were retrieved.
    stacker_200.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_200ul", count=0
    )
    stacker_50: FlexStackerContext = protocol.load_module(  # type: ignore[assignment]
        "flexStackerModuleV1", "C4"
    )
    # End state: five of six originally stored 50 uL racks were retrieved.
    stacker_50.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_50ul", count=1
    )

    thermocycler: ThermocyclerContext = protocol.load_module(  # type: ignore[assignment]
        "thermocycler module gen2"
    )
    thermocycler.open_lid()

    tiprack_a2_adapter = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter", "A2"
    )
    tiprack_50_6 = tiprack_a2_adapter.load_labware(
        "opentrons_flex_96_tiprack_50ul", "Used Stacker 50 uL Rack 6"
    )
    tiprack_a3_adapter = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter", "A3"
    )
    tiprack_50_7 = tiprack_a3_adapter.load_labware(
        "opentrons_flex_96_tiprack_50ul", "Used Stacker 50 uL Rack 7"
    )

    liquid_waste = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "B2", "Liquid Waste Reservoir"
    )
    reagent_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B3", "Reagent Plate 2"
    )
    temp_block: TemperatureModuleContext = protocol.load_module(  # type: ignore[assignment]
        "temperature module gen2", "C1"
    )
    reagent_plate_1 = temp_block.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Reagent Plate 1"
    )
    protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "C2", "Depleted EtOH Reservoir"
    )
    protocol.load_lid_stack(
        "opentrons_tough_pcr_auto_sealing_lid", "C3", 4
    )
    mag_block: MagneticBlockContext = protocol.load_module(  # type: ignore[assignment]
        "magneticBlockV1", "D2"
    )
    cleanup_plate_2 = mag_block.load_labware(
        "nest_96_wellplate_2ml_deep",
        "Cleanup Plate 2 (original end state)",
    )

    sample_plate_1 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        OFF_DECK,
        "Sample Plate 1 (retained off deck)",
    )
    sample_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        OFF_DECK,
        "Sample Plate 2 (retained off deck)",
    )
    cleanup_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        OFF_DECK,
        "Cleanup Plate 1 (retained off deck)",
    )

    residual_eluate = protocol.define_liquid(
        name="Residual eluate",
        description="Remaining water after forward final aspiration.",
        display_color="#82A9CF",
    )
    for well in cleanup_plate_2.wells():
        well.load_liquid(liquid=residual_eluate, volume=12)

    for well in reagent_plate_1.wells():
        well.load_liquid(
            protocol.define_liquid("RSB", display_color="#00FFF2"), volume=0
        )

    for well in reagent_plate_2.wells():
        well.load_liquid(
            protocol.define_liquid("Reagents", display_color="#704848"), volume=0
        )

    protocol.comment(
        f"Reversing final RSB/eluate remainder for {frag_mode} branch."
    )
    p1000.pick_up_tip(tiprack_50_6["A1"])
    p1000.aspirate(12, cleanup_plate_2["A1"].bottom(z=0.5))
    p1000.dispense(12, reagent_plate_1["B2"].bottom(z=0.5))
    p1000.return_tip()

    # Reverse the plate moves from the end of the original back to its initial
    # deck arrangement. OFF_DECK transitions are manual, as in the original.
    protocol.move_labware(cleanup_plate_2, "D4", use_gripper=True)
    protocol.move_labware(sample_plate_2, "A4", use_gripper=False)
    protocol.move_labware(sample_plate_1, thermocycler, use_gripper=False)
    protocol.move_labware(cleanup_plate_1, mag_block, use_gripper=False)

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
    p1000.pick_up_tip(tiprack_50_7["A1"])
    p1000.aspirate(4.33, liquid_waste["A1"].bottom(z=0.5))
    p1000.dispense(4.33, reagent_plate_1["A1"].bottom(z=0.5))
    p1000.aspirate(48.0, liquid_waste["A1"].bottom(z=0.5))
    p1000.dispense(48.0, reagent_plate_2["A1"].bottom(z=0.5))
    p1000.aspirate(2.0, liquid_waste["A1"].bottom(z=0.5))
    p1000.dispense(2.0, sample_plate_1["A1"].bottom(z=0.5))
    p1000.return_tip()
    for well in sample_plate_2.wells():
        well.load_liquid(water, 2.0)

    # Reconstruct the rack-labware counts in each stacker. These are used or
    # empty racks, not regenerated tips.
    offdeck_50_racks = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_50ul",
            OFF_DECK,
            f"Used Stacker 50 uL Rack {index}",
        )
        for index in (3, 4, 5)
    ]
    for rack in [*offdeck_50_racks, tiprack_50_6, tiprack_50_7]:
        protocol.move_labware(
            rack,
            stacker_50,
            use_gripper=rack not in offdeck_50_racks,
        )
        stacker_50.store()

    initial_50_rack_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        OFF_DECK,
        "Original Used 50 uL Rack 1",
    )
    initial_50_rack_2 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        OFF_DECK,
        "Original Used 50 uL Rack 2",
    )
    protocol.move_labware(
        initial_50_rack_1, tiprack_a2_adapter, use_gripper=False
    )
    protocol.move_labware(
        initial_50_rack_2, tiprack_a3_adapter, use_gripper=False
    )

    used_200_racks = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_200ul",
            OFF_DECK,
            f"Used Stacker 200 uL Rack {index}",
        )
        for index in range(1, 7)
    ]
    for rack in used_200_racks:
        protocol.move_labware(rack, stacker_200, use_gripper=False)
        stacker_200.store()

    if deactivate_modules:
        thermocycler.deactivate_block()
        thermocycler.deactivate_lid()
        temp_block.deactivate()

    p1000.reset_tipracks()
    protocol.comment(
        "Mechanical locations and stacker rack counts are reset. Rerun original."
    )
