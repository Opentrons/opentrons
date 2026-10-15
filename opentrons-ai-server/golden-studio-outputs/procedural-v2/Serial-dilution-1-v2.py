from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-1-v2',
    'author': 'OpentronsAI',
    'description': 'serial dilution',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tips = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'D1')
    tips_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C1')  # extra rack: 97 tips needed
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tips, tips_2])

    # Liquids
    diluent = protocol.define_liquid(
        name='Diluent',
        description='Diluent loaded in reservoir well A1',
        display_color='#33FF33',
    )
    solution = protocol.define_liquid(
        name='Solution',
        description='Solution to be serially diluted, loaded in reservoir well A2',
        display_color='#FF0000',
    )

    # Diluent: 96 wells x 100 uL = 9600 uL needed; load 12000 uL (within 15 mL well)
    reservoir.load_liquid(wells=[reservoir['A1']], volume=12000, liquid=diluent)
    # Solution: 8 rows x 100 uL = 800 uL needed; load 1500 uL
    reservoir.load_liquid(wells=[reservoir['A2']], volume=1500, liquid=solution)

    # Step 1: distribute 100 uL diluent from reservoir A1 to all plate wells
    pipette.transfer(100, reservoir['A1'], plate.wells(), new_tip='once')

    # Step 2: per-row solution addition and serial dilution
    for i in range(8):
        row = plate.rows()[i]

        # a. solution from reservoir A2 to first well of row, mix 3x 50 uL
        pipette.transfer(100, reservoir['A2'], row[0], mix_after=(3, 50), new_tip='always')

        # b. serial dilution: 11 transfers, mix 3x 50 uL after each
        pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50), new_tip='always')
