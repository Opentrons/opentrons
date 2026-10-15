from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-7-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 1)
    source = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 4)
    destination = protocol.load_labware('nest_96_wellplate_2ml_deep', 9)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', 'right', tip_racks=[tiprack])

    # Liquids
    sample = protocol.define_liquid(
        name='Sample',
        description='Sample liquid in the source plate',
        display_color='#FF0000',
    )
    source.load_liquid(wells=source.wells(), liquid=sample, volume=100)
    destination.load_empty(destination.wells())

    # Parameters
    TRANSFER_VOL = 50

    # Transfer 50 uL column to column, new tip for each transfer
    p300m.transfer(
        TRANSFER_VOL,
        source.columns(),
        destination.columns(),
        new_tip='always',
    )
