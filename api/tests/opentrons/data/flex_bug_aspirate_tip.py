from opentrons import protocol_api

metadata = {
    "protocolName": "Bug 7552 - Flex",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": "Simulation allows aspirating and dispensing on a tip rack",
}

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    protocol.load_trash_bin("A3")
    plate = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D1")

    pipette = protocol.load_instrument("flex_1channel_50", "left", tip_racks=[plate])

    pipette.transfer(5, plate.wells_by_name()["A1"], plate.wells_by_name()["B1"])
