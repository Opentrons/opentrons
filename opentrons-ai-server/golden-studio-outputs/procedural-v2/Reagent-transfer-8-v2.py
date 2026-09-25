from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-8-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware('opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical', 5)
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 1)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300_single = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack])

    # Define liquid
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plate',
        display_color='#00FFBF'
    )

    # Source well (first tube of the source rack)
    source_well = source_rack.wells()[0]

    # Load liquid into source well
    # Volume: enough for 96 wells * 90 uL = 8640 uL, using max capacity (50 mL tube assumed for first well)
    source_well.load_liquid(liquid=reagent, volume=source_well.max_volume * 0.9)

    # Destination wells
    destination_wells = dest_plate.wells()

    # Transfer 90 uL of reagent from first tube to each well in destination plate, keep same tip
    p300_single.transfer(
        90,
        source_well,
        destination_wells,
        new_tip='once'
    )
