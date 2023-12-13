from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Module In Staging Area Column 3",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

def run(ctx: protocol_api.ProtocolContext) -> None:

    ################
    ### FIXTURES ###
    ################
    ctx.load_waste_chute()
    ctx.load_labware("nest_1_reservoir_290ml", "C4")  # Implicitly define a Staging Area
    temp_module = ctx.load_module("temperature module gen2", "C3")
    temp_module.deactivate()

    
    
