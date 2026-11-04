"""Reverse companion for MiSeq Library Preparation.

Water-only ABR: cross-contamination is acceptable. Reverses nominal liquid
transfers and labware moves from the forward end state for automated rerun.
"""

from opentrons.protocol_api import (
    ALL,
    COLUMN,
    HeaterShakerContext,
    ParameterContext,
    ProtocolContext,
    TemperatureModuleContext,
    ThermocyclerContext,
    Well,
)

metadata = {
    "protocolName": "Reverse MiSeq Library Preparation",
    "author": "Opentrons",
    "description": "Reverse nominal transfers and restore the starting deck.",
}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: ParameterContext) -> None:
    """Mirror the forward protocol's runtime parameters."""
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
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )
    parameters.add_bool(
        variable_name="column_tip_pickup",
        display_name="Perform Column Tip Pickup",
        default=True,
    )


def run(protocol: ProtocolContext) -> None:
    """Undo transfers in dependency order and restore all gripper moves."""
    column_tip_pickup = protocol.params.column_tip_pickup  # type: ignore[attr-defined]

    tc: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]
    tc.open_lid()
    temp: TemperatureModuleContext = protocol.load_module(
        "temperatureModuleV2", "C1"
    )  # type: ignore[assignment]
    reagent_block = temp.load_adapter("opentrons_96_well_aluminum_block")
    hs: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_96_pcr_adapter")

    # Load every item where the forward protocol leaves it.
    pcr2_plate = reagent_block.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", label="PCR2 Plate"
    )
    pcr_reagents = hs_adapter.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", label="PCR Master Mix"
    )
    pcr1_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B2", label="PCR1"
    )
    dna_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", label="DNA"
    )
    indices_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3", label="Indices"
    )
    pcr1_dilution = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "A4",
        label="PCR1 Dilution",
    )
    pcr2_dilution = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C2",
        label="PCR2 Dilution",
    )
    reservoir = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C4",
        label="Water Reservoir",
    )
    eppendorf = protocol.load_labware(
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        "D2",
        label="Applied Biosystems 384",
    )
    partial_tiprack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D4")
    tiprack_adapter = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "B3")
    tiprack = tiprack_adapter.load_labware("opentrons_flex_96_tiprack_50ul")
    p96 = protocol.load_instrument("flex_96channel_200", "left", tip_racks=[tiprack])

    end_material = protocol.define_liquid(
        "Forward end-state material",
        description="Mixed PCR products and dilution liquid available to reverse",
        display_color="#0088FF",
    )
    for well in eppendorf.wells():
        well.load_liquid(end_material, 15)
    for plate, volume in [
        (pcr2_dilution, 170),
        (pcr2_plate, 11 if column_tip_pickup else 5),
        # Forward starts this plate at 200 uL/well, then adds 40 uL of water
        # and nets zero PCR1 material after the two 5 uL transfers.
        (pcr1_dilution, 240),
        (pcr1_plate, 7.5 if column_tip_pickup else 0),
    ]:
        for well in plate.wells():
            well.load_liquid(end_material, volume)

    def reverse_transfer(volume: float, source: Well, destination: Well) -> None:
        p96.aspirate(volume, source.bottom(0.5))
        p96.dispense(volume, destination.bottom(0.5))

    p96.configure_nozzle_layout(style=ALL)
    p96.pick_up_tip(tiprack["A1"])
    for well_name in ["B2", "B1", "A2", "A1"]:
        reverse_transfer(15, eppendorf[well_name], pcr2_dilution["A1"])
    p96.return_tip()

    protocol.move_labware(eppendorf, "A2", use_gripper=True)
    protocol.move_labware(reservoir, "D2", use_gripper=True)

    p96.pick_up_tip(tiprack["A1"])
    reverse_transfer(5, pcr2_dilution["A1"], pcr2_plate["A1"])
    reverse_transfer(25, pcr2_dilution["A1"], reservoir["A1"])
    p96.return_tip()

    protocol.move_labware(pcr2_plate, tc, use_gripper=True)
    protocol.move_labware(pcr1_dilution, reagent_block, use_gripper=True)

    p96.pick_up_tip(tiprack["A1"])
    reverse_transfer(5, pcr2_plate["A1"], pcr1_dilution["A1"])
    reverse_transfer(5, pcr1_dilution["A1"], pcr1_plate["A1"])
    reverse_transfer(40, pcr1_dilution["A1"], reservoir["A1"])
    reverse_transfer(5, pcr2_plate["A1"], indices_plate["A1"])
    p96.return_tip()

    protocol.move_labware(pcr2_dilution, "C4", use_gripper=True)
    protocol.move_labware(partial_tiprack, "C2", use_gripper=True)
    protocol.move_labware(pcr1_dilution, "A4", use_gripper=True)
    hs.open_labware_latch()
    protocol.move_labware(pcr_reagents, reagent_block, use_gripper=True)
    hs.close_labware_latch()

    if column_tip_pickup:
        p96.configure_nozzle_layout(style=COLUMN, start="A1")
        p96.pick_up_tip(partial_tiprack["A1"])
        for column_index in reversed(range(12)):
            reverse_transfer(6, pcr2_plate.rows()[0][column_index], pcr_reagents["A2"])
        p96.return_tip()

    protocol.move_labware(pcr2_plate, "D4", use_gripper=True)
    protocol.move_labware(pcr1_plate, tc, use_gripper=True)

    p96.configure_nozzle_layout(style=ALL)
    p96.pick_up_tip(tiprack["A1"])
    reverse_transfer(5, pcr1_plate["A1"], dna_plate["A1"])
    p96.return_tip()

    if column_tip_pickup:
        p96.configure_nozzle_layout(style=COLUMN, start="A1")
        p96.pick_up_tip(partial_tiprack["A1"])
        for column_index in reversed(range(12)):
            reverse_transfer(
                7.5, pcr1_plate.rows()[0][column_index], pcr_reagents["A1"]
            )
        p96.return_tip()

    p96.reset_tipracks()
    protocol.comment(
        "All persistent forward deck rearrangements were inverted; rerun original."
    )
