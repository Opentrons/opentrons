"""Liquid Set up Protocol for Millipore Protocols."""

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    SINGLE,
    COLUMN,
    ROW,
    ALL,
)

metadata = {
    "protocolName": "Liquid Set up for Millipore Protocols",
    "author": "Rhyann clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}


SLOTS = {
    "PARTIAL_TIP_RACK_1000": ["C2", "A1"],
    "SRC_RESERVOIR": "B3",
    "LABWARE": ["D1", "D2", "D3", "C1", "C3"],
    "TRASH_BIN": "A3",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol context."""
    parameters.add_str(
        variable_name="protocol_name",
        display_name="Protocol Name",
        description="Protocol name for identification",
        default="pure_proteome",
        choices=[
            {
                "display_name": "Duolink Day 1 Square Well",
                "value": "duolink_day1_square",
            },
            {
                "display_name": "Duolink Day 1 Round Well",
                "value": "duolink_day1_round",
            },
            {
                "display_name": "Duolink Day 2 Square Well",
                "value": "duolink_day2_square",
            },
            {
                "display_name": "Duolink Day 2 Round Well",
                "value": "duolink_day2_round",
            },
            {"display_name": "Pure Proteome", "value": "pure_proteome"},
            {"display_name": "SMC Protocol", "value": "smc_protocol"},
            {"display_name": "Milliplex Day 1", "value": "milliplex_day1"},
            {"display_name": "Milliplex Day 2", "value": "milliplex_day2"},
        ],
    )


def run(protocol: ProtocolContext) -> None:
    """Run the protocol."""
    protocol_name = protocol.params.protocol_name  # type: ignore[attr-defined]
    pipette = protocol.load_instrument("flex_96channel_1000")
    protocol.load_trash_bin(str(SLOTS["TRASH_BIN"]))
    tip_rack_partial_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", str(SLOTS["PARTIAL_TIP_RACK_1000"][0])
    )
    src_reservoir = protocol.load_labware(
        "nest_1_reservoir_290ml", str(SLOTS["SRC_RESERVOIR"])
    )
    if protocol_name == "smc_protocol":
        reservoir_12well = protocol.load_labware(
            "nest_12_reservoir_15ml", str(SLOTS["LABWARE"][0])
        )
        nest_deepwell = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][1])
        )
        tip_rack_partial_2 = protocol.load_labware(
            "opentrons_flex_96_tiprack_1000ul", str(SLOTS["PARTIAL_TIP_RACK_1000"][1])
        )
        pipette.configure_nozzle_layout(
            style=ROW, tip_racks=[tip_rack_partial_1], start="H1"
        )
        pipette.distribute(
            370,
            src_reservoir["A1"],
            [nest_deepwell["G1"], nest_deepwell["H1"]],
            blow_out=True,
            new_tip="once",
            blowout_destination="destination well",
        )
        pipette.configure_nozzle_layout(
            style=SINGLE, tip_racks=[tip_rack_partial_1], start="A1"
        )
        pipette.transfer(
            1000,
            src_reservoir["A1"],
            nest_deepwell["A1"].bottom(z=2),
            blow_out=True,
            new_tip="once",
            blowout_destination="destination well",
        )
        pipette.configure_nozzle_layout(
            style=COLUMN, tip_racks=[tip_rack_partial_2], start="A12"
        )
        pipette.distribute(
            [12100 / 8, 11500 / 8, 4000 / 8, 2500 / 8, 2500 / 8],
            src_reservoir["A1"],
            [
                reservoir_12well["A1"],
                reservoir_12well["A4"],
                reservoir_12well["A5"],
                reservoir_12well["A6"],
                reservoir_12well["A7"],
            ],
            blow_out=True,
            new_tip="once",
            blowout_destination="destination well",
        )

    if protocol_name == "duolink_day1_round":
        nest_deepwell = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][0])
        )
        pipette.configure_nozzle_layout(
            style=COLUMN, tip_racks=[tip_rack_partial_1], start="A12"
        )
        pipette.distribute(
            520,
            src_reservoir["A1"],
            [
                nest_deepwell["A1"],
                nest_deepwell["A2"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )
    if protocol_name == "duolink_day1_square":
        nest_deepwell = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][0])
        )
        pipette.configure_nozzle_layout(
            style=COLUMN, tip_racks=[tip_rack_partial_1], start="A12"
        )
        pipette.distribute(
            1040,
            src_reservoir["A1"],
            [
                nest_deepwell["A1"],
                nest_deepwell["A2"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )
    if protocol_name == "duolink_day2_round":
        reservoir_12well = protocol.load_labware(
            "nest_12_reservoir_15ml", str(SLOTS["LABWARE"][0])
        )
        nest_deepwell = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][1])
        )
        pipette.distribute(
            10000 / 8,
            src_reservoir["A1"],
            [
                reservoir_12well["A1"],
                reservoir_12well["A2"],
                reservoir_12well["A3"],
                reservoir_12well["A4"],
                reservoir_12well["A5"],
                reservoir_12well["A6"],
                reservoir_12well["A7"],
                reservoir_12well["A8"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )
        pipette.distribute(
            520,
            src_reservoir["A1"],
            [
                nest_deepwell["A1"],
                nest_deepwell["A2"],
                nest_deepwell["A3"],
                nest_deepwell["A4"],
                nest_deepwell["A5"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )

    if protocol_name == "duolink_day2_square":
        pipette.distribute(
            10000 / 8,
            src_reservoir["A1"],
            [
                reservoir_12well["A1"],
                reservoir_12well["A2"],
                reservoir_12well["A3"],
                reservoir_12well["A4"],
                reservoir_12well["A5"],
                reservoir_12well["A6"],
                reservoir_12well["A7"],
                reservoir_12well["A8"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )
        pipette.distribute(
            1040,
            src_reservoir["A1"],
            [
                nest_deepwell["A1"],
                nest_deepwell["A2"],
                nest_deepwell["A3"],
                nest_deepwell["A4"],
                nest_deepwell["A5"],
            ],
            blow_out=True,
            blowout_destination="destination well",
            new_tip="once",
        )
    if protocol_name == "pure_proteome":
        reservoir_12well = protocol.load_labware(
            "nest_12_reservoir_15ml", str(SLOTS["LABWARE"][0])
        )
        axygen_plate = protocol.load_labware(
            "axygen_96_wellplate_500ul", str(SLOTS["LABWARE"][1])
        )
        full_tip_rack_adapter = protocol.load_adapter(
            "opentrons_flex_96_tiprack_adapter",
            str(SLOTS["PARTIAL_TIP_RACK_1000"][1]),
        )
        full_tip_rack = full_tip_rack_adapter.load_labware(
            "opentrons_flex_96_tiprack_1000ul", "FULL TIP RACK"
        )
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[full_tip_rack])
        pipette.transfer(
            120,
            src_reservoir["A1"],
            axygen_plate["A1"].bottom(z=2),
            blow_out=True,
            blowout_destination="destination well",
            trash_tips=False,
        )
        pipette.configure_nozzle_layout(
            style=COLUMN, tip_racks=[tip_rack_partial_1], start="A12"
        )
        pipette.transfer(
            [5000 / 8, 10800 / 8],
            src_reservoir["A1"],
            [reservoir_12well["A3"], reservoir_12well["A10"]],
            blow_out=True,
            new_tip="once",
            blowout_destination="destination well",
        )
