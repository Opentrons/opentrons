from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-3-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 2)
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 3)
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 9)

    # Pipette
    p20 = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tiprack])

    # Parameters
    transfer_vol = 1  # uL
    num_dest_wells = len(dest_plate.wells())  # 96

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to every well of the destination plate',
        display_color='#0077FF',
    )

    # Source tube A1 holds the reagent: 1 uL x 96 wells = 96 uL needed, plus excess for dead volume
    source_rack.load_liquid(wells=[source_rack['A1']], volume=200, liquid=reagent)
    # Destination wells start empty
    dest_plate.load_empty(dest_plate.wells())

    # Wells
    source_well = source_rack['A1']
    dest_wells = dest_plate.wells()

    # Transfer 1 uL from first tube to every well in the plate with the same tip
    p20.transfer(transfer_vol, source_well, dest_wells, new_tip='once')
