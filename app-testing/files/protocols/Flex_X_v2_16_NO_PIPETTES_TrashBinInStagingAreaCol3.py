from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Trash Bin in Staging Area Column 3",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_labware("nest_1_reservoir_290ml", "C4")  # Implicitly define a Staging Area
    ctx.load_trash_bin("C3")
