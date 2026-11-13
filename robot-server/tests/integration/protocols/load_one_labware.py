from opentrons import protocol_api

metadata = {
    "protocolName": "Load One Labware",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_labware("biorad_96_wellplate_200ul_pcr", "A1")
