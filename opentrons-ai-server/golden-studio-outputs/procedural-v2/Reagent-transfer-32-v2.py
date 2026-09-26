from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-32-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Source labware 1: 3x Corning 96 Well Plate 360 uL Flat in D1, D2, D3
    source_plate_d1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
    source_plate_d2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')
    source_plate_d3 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D3')
    source_plates_1 = [source_plate_d1, source_plate_d2, source_plate_d3]

    # Source labware 2: reservoir in A1
    reservoir = protocol.load_labware('nest_1_reservoir_195ml', 'A1')

    # Destination labware: 3x Corning 96 Well Plate 360 uL Flat in C1, C2, C3
    dest_plate_c1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C1')
    dest_plate_c2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C2')
    dest_plate_c3 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C3')
    dest_plates = [dest_plate_c1, dest_plate_c2, dest_plate_c3]

    # Tip racks
    tiprack_200_b1 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B1')
    tiprack_200_b2 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')
    tiprack_200_b3 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B3')
    tiprack_50_a2 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Pipettes
    pipette_50 = protocol.load_instrument(
        'flex_1channel_50', 'right', tip_racks=[tiprack_50_a2]
    )
    pipette_1000 = protocol.load_instrument(
        'flex_1channel_1000', 'left',
        tip_racks=[tiprack_200_b1, tiprack_200_b2, tiprack_200_b3]
    )

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Liquid definitions
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred from reservoir to destination plates',
        display_color='#33FF33'
    )
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid transferred from source plates to destination plates',
        display_color='#FF0000'
    )

    # Load liquids into wells before pipetting
    # Reservoir first well holds reagent
    reservoir_well = reservoir.wells()[0]
    reservoir_well.load_liquid(liquid=reagent_liquid, volume=0.8 * reservoir_well.max_volume)

    # All wells of source labware 1 (3 plates) hold sample liquid
    source_wells_1 = []
    for plate in source_plates_1:
        for well in plate.wells():
            well.load_liquid(liquid=sample_liquid, volume=100)
            source_wells_1.append(well)

    # All destination wells (3 plates)
    destination_wells = []
    for plate in dest_plates:
        destination_wells.extend(plate.wells())

    # Command N: transfer 20 uL of reagent from reservoir A1 to all destination wells, reuse tip
    pipette_50.transfer(
        20,
        reservoir_well,
        destination_wells,
        new_tip='once'
    )

    # Command O: well-to-well transfer of 100 uL from source labware 1 to destination labware, new tip each
    pipette_1000.transfer(
        100,
        source_wells_1,
        destination_wells,
        new_tip='always'
    )
