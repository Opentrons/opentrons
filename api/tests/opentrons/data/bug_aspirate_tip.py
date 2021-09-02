from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "Bug 7552",
    "author": "Name <email@address.com>",
    "description": "Simulation allows aspirating and dispensing on a tip rack",
    "apiLevel": "2.11",
}


# protocol run function. the part after the colon lets your editor know
# where to look for autocomplete suggestions
def run(protocol: protocol_api.ProtocolContext):
    # labware
    plate = protocol.load_labware("geb_96_tiprack_10ul", 4)

    # pipettes
    pipette = protocol.load_instrument("p300_single", "left", tip_racks=[plate])

    # commands
    pipette.transfer(5, plate.wells_by_name()["A1"], plate.wells_by_name()["B1"])
