from opentrons import protocol_api

metadata = {
    "protocolName": "simple",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.12",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    ctx.comment("A single comment.")
