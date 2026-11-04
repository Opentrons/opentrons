from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-2-v2',
    'author': 'OpentronsAI',
    'description': (
        'This protocol is the outcome of following the Python Protocol API Tutorial '
        'located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution '
        'and progressively dilutes it by transferring it stepwise across a plate.'
    ),
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tips = protocol.load_labware('opentrons_96_tiprack_300ul', 'D1')
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=[tips])

    # Liquids
    diluent_liquid = protocol.define_liquid(
        name='Diluent',
        description='Diluent in reservoir well A1',
        display_color='#33FF33',
    )
    solution_liquid = protocol.define_liquid(
        name='Solution',
        description='Solution to be serially diluted in reservoir well A2',
        display_color='#FF0000',
    )

    # Volume loaded per reservoir well. Each channel draws from the same well
    # (A1 is 8 x 100 uL x 12 columns = 9.6 mL for diluent; A2 is 8 x 100 uL = 0.8 mL
    # for solution), so 12 mL and 5 mL are comfortable amounts for a 15 mL well.
    reservoir['A1'].load_liquid(liquid=diluent_liquid, volume=12000)
    reservoir['A2'].load_liquid(liquid=solution_liquid, volume=5000)

    # With an 8-channel pipette, targeting row A addresses a full column
    row = plate.rows()[0]

    # J. Distribute 100 uL diluent from reservoir A1 to the first row of the plate
    # (every column, using one tip for the whole distribution)
    pipette.transfer(100, reservoir['A1'], row, new_tip='once')

    # K. Transfer 100 uL solution from reservoir A2 to the first column,
    # mixing 3 times with 50 uL after the transfer
    pipette.transfer(
        100,
        reservoir['A2'],
        row[0],
        mix_after=(3, 50),
        new_tip='always',
    )

    # L. Serial dilution: column 1 -> 2, 2 -> 3, ... 11 -> 12 (11 transfers)
    # Mix 3 times with 50 uL after each transfer
    pipette.transfer(
        100,
        row[:11],
        row[1:],
        mix_after=(3, 50),
        new_tip='always',
    )
