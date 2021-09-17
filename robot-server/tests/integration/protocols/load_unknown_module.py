from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Extraction",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.4",
}


def run(ctx: ProtocolContext) -> None:
    ctx.load_module("pickle maker", "6")
