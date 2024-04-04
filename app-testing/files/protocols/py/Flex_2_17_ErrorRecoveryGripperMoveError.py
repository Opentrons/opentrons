from opentrons import protocol_api

# metadata
metadata = {
    'protocolName': 'Error Recovery Testing Protocol - Gripper Drop/Not Pick Up',
    'author': 'Sara Kowalski',
    'description': 'Simple Protocol that user can use to trigger a gripper moves on the deck',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.17",
}

DRYRUN = 'YES'
USE_GRIPPER = 'TRUE'

# protocol run function
def run(protocol: protocol_api.ProtocolContext):

    sample_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt','A2') #to test missed pick up, leave slot empty

    #instruments
    pip8 = protocol.load_instrument('flex_8channel_1000', mount = 'left')

    protocol.move_labware(
        labware=sample_plate,
        new_location= "C3",
        use_gripper=USE_GRIPPER
    )

    #enter error recovery