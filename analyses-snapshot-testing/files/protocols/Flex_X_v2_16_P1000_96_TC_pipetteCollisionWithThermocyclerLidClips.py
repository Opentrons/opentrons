# Pulled from: https://github.com/Opentrons/opentrons/pull/14522


from opentrons import protocol_api
from opentrons.protocol_api import COLUMN
from opentrons import types

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


def run(protocol: protocol_api.ProtocolContext):
    thermocycler = protocol.load_module("thermocycler module gen2")
    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A2")
    p1000 = protocol.load_instrument("flex_96channel_1000", "left")
    thermocycler.open_lid()
    p1000.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tiprack])
    p1000.pick_up_tip(tiprack.wells()[0].center().move(types.Point(x=-10, y=10, z=-10)))
