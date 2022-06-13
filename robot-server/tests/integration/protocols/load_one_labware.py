from opentrons import protocol_api

metadata = {
    "protocolName": "Load One Labware",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.12",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1)
