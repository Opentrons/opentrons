from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-9-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {'robotType': 'OT-2', 'apiLevel': '2.28'}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 4)
    dest_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 7)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 8)

    # Pipette
    p300 = protocol.load_instrument('p300_single_gen2', 'right', tip_racks=[tiprack])

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Samples',
        description='Samples in source tube rack',
        display_color='#FF0000',
    )

    # Each source tube is used for 4 destination wells (96 / 24) x 80 uL = 320 uL
    # Load 400 uL per tube to cover the transfers
    for tube in source_rack.wells():
        tube.load_liquid(liquid=sample_liquid, volume=400)

    # Transfer 80 uL from each of the 24 tubes to the 96 wells (each tube -> 4 wells)
    transfer_volume = 80
    source_wells = source_rack.wells()
    dest_wells = dest_plate.wells()

    p300.transfer(transfer_volume, source_wells, dest_wells, new_tip='always')
