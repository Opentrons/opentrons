from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-7-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 1)
    source = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 4)
    destination = protocol.load_labware('nest_96_wellplate_2ml_deep', 9)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', mount='right', tip_racks=[tiprack])

    # Define liquid
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid to be transferred from source plate',
        display_color='#FF0000'
    )

    # Assign liquid to every source well before pipetting
    for well in source.wells():
        well.load_liquid(liquid=sample_liquid, volume=50)

    # Transfer 50 uL from each column of source to corresponding column of destination
    # Change tips for each transfer
    source_cols = source.columns()
    dest_cols = destination.columns()

    p300m.transfer(50, source_cols, dest_cols, new_tip='always')
