from opentrons.protocol_api import ProtocolContext

metadata = {
    "author": "engineer@opentrons.com",
    "protocolName": "Flex basic transfer protocol",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}


def run(protocol: ProtocolContext) -> None:
    plate = protocol.load_labware("corning_96_wellplate_360ul_flat", "D1")
    tiprack_1 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
    p50 = protocol.load_instrument("flex_1channel_50", "right", tip_racks=[tiprack_1])

    # TODO (spp, 2023-07-13): replace 'p1000_single_gen3' with the newer name once '.._gen3' is discontinued
    p1000 = protocol.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack_1])

    p50.pick_up_tip()
    p50.aspirate(40, plate["A1"])
    p50.dispense(40, plate["B1"])
    p50.return_tip()

    p1000.pick_up_tip()
    p1000.return_tip()
