from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Magnetic Module in Flex Protocol",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_module("magnetic module gen2", "C1")
