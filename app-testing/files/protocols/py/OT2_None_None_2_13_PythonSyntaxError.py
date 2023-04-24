# import that does not work
from opentrons import protocol_api

import superspecialmagic

metadata = {
    "protocolName": "bad import",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("import superspecialmagic"),
    "apiLevel": "2.13",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""
    ctx.comment("Hello world")
