from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Access to Fixed Trash Property",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.fixed_trash
    
