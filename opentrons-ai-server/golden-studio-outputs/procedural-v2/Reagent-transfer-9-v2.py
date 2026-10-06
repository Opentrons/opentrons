from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-9-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 4)
    destination_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 7)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 8)

    # Pipette
    p300_single = protocol.load_instrument('p300_single_gen2', 'right', tip_racks=[tiprack])

    # Define liquid
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid in source tube rack',
        display_color='#FF0000'
    )

    # Assign liquid to every source well before pipetting
    source_wells = source_rack.wells()
    for well in source_wells:
        well.load_liquid(liquid=sample_liquid, volume=1500)

    # Transfer 80 uL of samples from each tube to each well of the destination plate
    destination_wells = destination_plate.wells()

    p300_single.transfer(80, source_wells, destination_wells, new_tip='always')
