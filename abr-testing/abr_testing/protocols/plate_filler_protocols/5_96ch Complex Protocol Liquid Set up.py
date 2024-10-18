"""Plate Filler Protocol for 96ch Complex Protocol."""
from opentrons import protocol_api

metadata = {
    "protocolName": "DVT2ABR5 and 6 Liquids: 96ch Complex Protocol",
    "author": "Rhyann clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    # Initiate Labware
    tiprack_1000 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )  # Tip Rack
    master_reservoir = protocol.load_labware("axygen_1_reservoir_90ml", "C2")
    reservoir = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "D2", "Reservoir"
    )  # Reservoir
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tiprack_1000]
    )  # Pipette

    vol = 500

    column_list = [
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "A9",
        "A10",
        "A11",
        "A12",
    ]
    for i in column_list:
        p1000.pick_up_tip()
        p1000.aspirate(vol, master_reservoir["A1"].bottom(z=0.5))
        p1000.dispense(vol, reservoir[i].top())
        p1000.blow_out(location=master_reservoir["A1"].top())
        p1000.return_tip()
