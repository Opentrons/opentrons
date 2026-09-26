from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-2-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware(
        'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt', 1
    )
    destination = protocol.load_labware(
        'opentrons_96_aluminumblock_biorad_wellplate_200ul', 5
    )
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300s = protocol.load_instrument(
        'p300_single_gen2', mount='left', tip_racks=[tiprack]
    )

    # Wells
    source_well = source.wells_by_name()['A1']
    dest_wells = [destination.wells_by_name()[well] for well in ['E12', 'G12', 'B9', 'A6', 'D7']]
    transfer_vol = 117.0

    # Define and load liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination wells',
        display_color='#00FFF2'
    )
    source_well.load_liquid(liquid=reagent_liquid, volume=transfer_vol * len(dest_wells))

    # Commands
    p300s.transfer(transfer_vol, source_well, dest_wells, new_tip='always')
