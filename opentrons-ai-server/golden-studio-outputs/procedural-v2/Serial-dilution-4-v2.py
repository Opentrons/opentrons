from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-4-v2',
    'author': 'OpentronsAI',
    'description': (
        'This protocol is the outcome of following the Python Protocol API Tutorial '
        'located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution '
        'and progressively dilutes it by transferring it stepwise across a plate.'
    ),
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tips = protocol.load_labware('opentrons_96_tiprack_300ul', 1)
    tips_2 = protocol.load_labware('opentrons_96_tiprack_300ul', 4)  # extra tips: 24 pickups needed
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 2)
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 3)

    # Pipette
    pipette = protocol.load_instrument('p300_multi_gen2', 'right', tip_racks=[tips, tips_2])

    # Liquid definitions
    diluent = protocol.define_liquid(
        name='Diluent',
        description='Diluent (e.g. water) in reservoir well A1',
        display_color='#33AAFF',
    )
    solution = protocol.define_liquid(
        name='Solution',
        description='Solution to be serially diluted in reservoir well A2',
        display_color='#FF3333',
    )

    # Assign liquids to wells (before pipetting steps use them)
    reservoir['A1'].load_liquid(liquid=diluent, volume=5000)
    reservoir['A2'].load_liquid(liquid=solution, volume=1000)

    row = plate.rows()[0]

    # J. Distribute diluent from reservoir A1 to the first row of the plate
    pipette.transfer(100, reservoir['A1'], row, new_tip='always')

    # K. Transfer solution from reservoir A2 to column 1 and mix
    pipette.transfer(100, reservoir['A2'], row[0], mix_after=(3, 50), new_tip='always')

    # L. Serial dilution: column 1 -> 2, ... 11 -> 12 (11 transfers)
    pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50), new_tip='always')
