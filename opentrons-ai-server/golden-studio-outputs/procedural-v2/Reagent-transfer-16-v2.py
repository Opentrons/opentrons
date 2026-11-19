from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-16-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {'robotType': 'OT-2', 'apiLevel': '2.28'}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_plates = [
        protocol.load_labware('corning_96_wellplate_360ul_flat', slot)
        for slot in [1, 2, 3]
    ]
    reservoir = protocol.load_labware('nest_1_reservoir_195ml', 10)
    destination_plates = [
        protocol.load_labware('corning_96_wellplate_360ul_flat', slot)
        for slot in [4, 5, 6]
    ]
    tipracks_300 = [
        protocol.load_labware('opentrons_96_tiprack_300ul', slot)
        for slot in [7, 8, 9]
    ]
    tiprack_20 = protocol.load_labware('opentrons_96_tiprack_20ul', 11)

    # Pipettes
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=tipracks_300)
    p20 = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tiprack_20])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent in the source reservoir',
        display_color='#33AAFF',
    )
    sample = protocol.define_liquid(
        name='Sample',
        description='Sample in the source plates',
        display_color='#FF5533',
    )

    # Volumes
    reagent_transfer_vol = 20
    sample_transfer_vol = 100
    reservoir_well = reservoir.wells_by_name()['A1']

    # Assign liquids before any pipetting
    reservoir_well.load_liquid(liquid=reagent, volume=10000)
    for plate in source_plates:
        for well in plate.wells():
            well.load_liquid(liquid=sample, volume=200)
    for plate in destination_plates:
        plate.load_empty(plate.wells())

    # Step N: reagent from reservoir A1 to all destination wells, same tip
    all_destination_wells = [w for plate in destination_plates for w in plate.wells()]
    p20.transfer(reagent_transfer_vol, reservoir_well, all_destination_wells, new_tip='once')

    # Step O: well-to-well sample transfer, new tip each time
    all_source_wells = [w for plate in source_plates for w in plate.wells()]
    p300.transfer(sample_transfer_vol, all_source_wells, all_destination_wells, new_tip='always')
