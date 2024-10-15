"""Plate Filler Protocol for Simple Normalize Long."""
from opentrons import protocol_api

metadata = {
    "protocolName": "DVT1ABR2 Liquids: BMS PCR Protocol",
    "author": "Rhyann clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    # Initiate Labware
    tiprack_1000 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    master_reservoir = protocol.load_labware("axygen_1_reservoir_90ml", "C2")
    pcr_plate_1 = protocol.load_labware("nest_12_reservoir_15ml", "C3", "PCR Plate 1")
    pcr_plate_2 = protocol.load_labware("nest_12_reservoir_15ml", "B3", "PCR Plate 2")
    # Load Pipette
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tiprack_1000]
    )
    # Steps
    p1000.pick_up_tip()
    p1000.aspirate(200, master_reservoir["A1"])
    # Dispense into plate 1
    p1000.dispense(100, pcr_plate_1["A1"].top())
    # Dispense into plate 2
    p1000.dispense(100, pcr_plate_2["A1"].top())
    p1000.return_tip()
