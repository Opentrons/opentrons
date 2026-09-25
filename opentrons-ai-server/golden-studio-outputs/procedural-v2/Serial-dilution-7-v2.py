from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-7-v2',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):

    # Constants
    DILUTION_FACTOR = 3
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150.0
    AIR_GAP_VOLUME = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

    # Labware
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')
    tipracks = [
        protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', slot)
        for slot in ['C1', 'D1']
    ]

    # Pipette
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=tipracks)

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Reagent setup
    diluent = reservoir.wells()[0]
    source = plate.columns()[0]

    # Define and load liquids
    diluent_liquid = protocol.define_liquid(
        name="Diluent",
        description="Diluent liquid is filled in the reservoir",
        display_color="#33FF33"
    )
    sample_liquid = protocol.define_liquid(
        name="Sample",
        description="Non-diluted samples are loaded in the 1st column",
        display_color="#FF0000"
    )

    diluent.load_liquid(liquid=diluent_liquid, volume=0.8 * diluent.max_volume)
    for well in source:
        well.load_liquid(liquid=sample_liquid, volume=150)

    # Set up dilution destinations along row A
    dilution_destination_sets = [[well] for well in plate.rows()[0][1:NUM_DILUTIONS + 1]]
    dilution_source_sets = [[well] for well in plate.rows()[0][:NUM_DILUTIONS]]
    blank_set = [plate.rows()[0][NUM_DILUTIONS + 1]]

    # 1. Distribute diluent to wells 2-11 in row A
    all_diluent_destinations = [well for wells in dilution_destination_sets for well in wells]
    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        pipette.transfer(
            diluent_volume,
            diluent,
            dest,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()

    # 2. Perform serial dilutions along row A
    pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets, dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                transfer_volume,
                s,
                d,
                air_gap=AIR_GAP_VOLUME,
                mix_after=(5, TOTAL_MIXING_VOLUME / 2),
                new_tip='never'
            )
    pipette.drop_tip()

    # 3. Add blank to well A12
    pipette.pick_up_tip()
    for blank_well in blank_set:
        pipette.transfer(
            diluent_volume,
            diluent,
            blank_well,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()
