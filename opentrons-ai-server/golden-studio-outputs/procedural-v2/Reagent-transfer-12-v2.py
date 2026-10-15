from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-12-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {'robotType': 'OT-2', 'apiLevel': '2.28'}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 1)
    source_2 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 2)
    source_3 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 4)
    source_4 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 5)
    destination = protocol.load_labware('nest_96_wellplate_2ml_deep', 3)

    # Tip racks
    tiprack_1 = protocol.load_labware('opentrons_96_filtertiprack_200ul', 7)
    tiprack_2 = protocol.load_labware('opentrons_96_filtertiprack_200ul', 8)

    # Pipette
    p300 = protocol.load_instrument('p300_single_gen2', 'right', tip_racks=[tiprack_1, tiprack_2])

    # Parameters
    transfer_vol = 20  # uL
    source_tube_vol = 100  # uL (assumed starting volume per tube)

    # Liquids
    sample_1 = protocol.define_liquid(name='Sample rack 1', description='Samples in source labware 1', display_color='#FF0000')
    sample_2 = protocol.define_liquid(name='Sample rack 2', description='Samples in source labware 2', display_color='#00AA00')
    sample_3 = protocol.define_liquid(name='Sample rack 3', description='Samples in source labware 3', display_color='#0000FF')
    sample_4 = protocol.define_liquid(name='Sample rack 4', description='Samples in source labware 4', display_color='#FFA500')
    pool_1 = protocol.define_liquid(name='Pool 1', description='Pooled samples from rack 1', display_color='#FF9999')
    pool_2 = protocol.define_liquid(name='Pool 2', description='Pooled samples from rack 2', display_color='#99DD99')
    pool_3 = protocol.define_liquid(name='Pool 3', description='Pooled samples from rack 3', display_color='#9999FF')
    pool_4 = protocol.define_liquid(name='Pool 4', description='Pooled samples from rack 4', display_color='#FFD699')

    # Load liquids into source tubes
    for rack, liquid in [(source_1, sample_1), (source_2, sample_2), (source_3, sample_3), (source_4, sample_4)]:
        for well in rack.wells():
            well.load_liquid(liquid=liquid, volume=source_tube_vol)

    # Label pooled destination wells (expected final contents: 24 x 20 uL = 480 uL)
    pooled_vol = transfer_vol * 24
    destination['A1'].load_liquid(liquid=pool_1, volume=pooled_vol)
    destination['B1'].load_liquid(liquid=pool_2, volume=pooled_vol)
    destination['C1'].load_liquid(liquid=pool_3, volume=pooled_vol)
    destination['D1'].load_liquid(liquid=pool_4, volume=pooled_vol)

    # Commands O-R: pool each rack into its destination well, new tip per tube
    p300.transfer(transfer_vol, source_1.wells(), destination['A1'], new_tip='always')
    p300.transfer(transfer_vol, source_2.wells(), destination['B1'], new_tip='always')
    p300.transfer(transfer_vol, source_3.wells(), destination['C1'], new_tip='always')
    p300.transfer(transfer_vol, source_4.wells(), destination['D1'], new_tip='always')
