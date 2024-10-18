"""Plate Filler Protocol for Simple Normalize Long."""
from opentrons import protocol_api

metadata = {
    "protocolName": "DVT1ABR1 Liquids: Simple Normalize Long",
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
    tiprack_1000 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    master_reservoir = protocol.load_labware("axygen_1_reservoir_90ml", "C2")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2", "Reservoir")
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tiprack_1000]
    )

    vol = 5400 / 8

    columns = ["A1", "A2", "A3", "A4", "A5"]
    for i in columns:
        p1000.transfer(
            vol,
            source=master_reservoir["A1"].bottom(z=0.5),
            dest=reservoir[i].top(),
            blowout=True,
            blowout_location="source well",
            trash=False,
        )
