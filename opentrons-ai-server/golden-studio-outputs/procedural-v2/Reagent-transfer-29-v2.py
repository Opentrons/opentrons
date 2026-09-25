from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-29-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware: source tube racks
    source_1 = protocol.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'D1'
    )
    source_2 = protocol.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'D2'
    )
    source_3 = protocol.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'C1'
    )
    source_4 = protocol.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'C2'
    )

    # Labware: destination deep well plate
    destination = protocol.load_labware('nest_96_wellplate_2ml_deep', 'D3')

    # Tip racks
    tiprack_1 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B1')
    tiprack_2 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')

    # Pipette
    p1000s = protocol.load_instrument(
        'flex_1channel_1000', 'right', tip_racks=[tiprack_1, tiprack_2]
    )

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Define liquids
    liquid_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent pooled from source labware 1',
        display_color='#FF0000',
    )
    liquid_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent pooled from source labware 2',
        display_color='#00FF00',
    )
    liquid_3 = protocol.define_liquid(
        name='Reagent 3',
        description='Reagent pooled from source labware 3',
        display_color='#0000FF',
    )
    liquid_4 = protocol.define_liquid(
        name='Reagent 4',
        description='Reagent pooled from source labware 4',
        display_color='#FFFF00',
    )

    # Load liquids into every well of each source rack before pipetting
    for well in source_1.wells():
        well.load_liquid(liquid=liquid_1, volume=1500)
    for well in source_2.wells():
        well.load_liquid(liquid=liquid_2, volume=1500)
    for well in source_3.wells():
        well.load_liquid(liquid=liquid_3, volume=1500)
    for well in source_4.wells():
        well.load_liquid(liquid=liquid_4, volume=1500)

    # Transfer volume
    transfer_vol = 20

    # Command O: Pool source labware 1 -> destination A1
    p1000s.transfer(
        transfer_vol,
        source_1.wells(),
        destination['A1'],
        new_tip='always'
    )

    # Command P: Pool source labware 2 -> destination B1
    p1000s.transfer(
        transfer_vol,
        source_2.wells(),
        destination['B1'],
        new_tip='always'
    )

    # Command Q: Pool source labware 3 -> destination C1
    p1000s.transfer(
        transfer_vol,
        source_3.wells(),
        destination['C1'],
        new_tip='always'
    )

    # Command R: Pool source labware 4 -> destination D1
    p1000s.transfer(
        transfer_vol,
        source_4.wells(),
        destination['D1'],
        new_tip='always'
    )
