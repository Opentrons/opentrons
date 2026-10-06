from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-12-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


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
    p300_single = protocol.load_instrument(
        'p300_single_gen2', 'right', tip_racks=[tiprack_1, tiprack_2]
    )

    # Volume
    transfer_vol = 20

    # Define liquids
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent pooled from source labware 1',
        display_color='#FF0000'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent pooled from source labware 2',
        display_color='#00FF00'
    )
    reagent_3 = protocol.define_liquid(
        name='Reagent 3',
        description='Reagent pooled from source labware 3',
        display_color='#0000FF'
    )
    reagent_4 = protocol.define_liquid(
        name='Reagent 4',
        description='Reagent pooled from source labware 4',
        display_color='#FFFF00'
    )

    # Load liquids into source wells
    for well in source_1.wells():
        well.load_liquid(liquid=reagent_1, volume=100)
    for well in source_2.wells():
        well.load_liquid(liquid=reagent_2, volume=100)
    for well in source_3.wells():
        well.load_liquid(liquid=reagent_3, volume=100)
    for well in source_4.wells():
        well.load_liquid(liquid=reagent_4, volume=100)

    # Transfer/pool samples
    p300_single.transfer(
        transfer_vol, source_1.wells(), destination['A1'], new_tip='always'
    )
    p300_single.transfer(
        transfer_vol, source_2.wells(), destination['B1'], new_tip='always'
    )
    p300_single.transfer(
        transfer_vol, source_3.wells(), destination['C1'], new_tip='always'
    )
    p300_single.transfer(
        transfer_vol, source_4.wells(), destination['D1'], new_tip='always'
    )
