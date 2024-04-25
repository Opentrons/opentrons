from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Module in Staging Area Column 4",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_module("temperature module gen2", "B4")
