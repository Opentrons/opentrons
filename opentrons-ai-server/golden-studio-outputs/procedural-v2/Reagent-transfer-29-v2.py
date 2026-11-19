from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-29-v2',
    'author': 'OpentronsAI',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware: source tube racks
    source_1 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'D1')
    source_2 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'D2')
    source_3 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'C1')
    source_4 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 'C2')

    # Labware: destination deep well plate
    destination = protocol.load_labware('nest_96_wellplate_2ml_deep', 'D3')

    # Labware: tip racks (200 uL filter tips)
    tiprack_1 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B1')
    tiprack_2 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')

    # Pipette
    pipette = protocol.load_instrument(
        'flex_1channel_1000', 'right', tip_racks=[tiprack_1, tiprack_2]
    )

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Parameters
    TRANSFER_VOL = 20  # uL
    SOURCE_TUBE_VOL = 1000  # uL (assumed starting volume per tube, for labeling only)

    # Liquids: one distinct sample liquid per source rack
    sample_1 = protocol.define_liquid(
        name='Sample set 1',
        description='Samples in source rack 1 (slot D1)',
        display_color='#FF0000',
    )
    sample_2 = protocol.define_liquid(
        name='Sample set 2',
        description='Samples in source rack 2 (slot D2)',
        display_color='#00AA00',
    )
    sample_3 = protocol.define_liquid(
        name='Sample set 3',
        description='Samples in source rack 3 (slot C1)',
        display_color='#0000FF',
    )
    sample_4 = protocol.define_liquid(
        name='Sample set 4',
        description='Samples in source rack 4 (slot C2)',
        display_color='#FFA500',
    )

    # Load liquids into every source tube (before any pipetting step)
    source_1.load_liquid(wells=source_1.wells(), volume=SOURCE_TUBE_VOL, liquid=sample_1)
    source_2.load_liquid(wells=source_2.wells(), volume=SOURCE_TUBE_VOL, liquid=sample_2)
    source_3.load_liquid(wells=source_3.wells(), volume=SOURCE_TUBE_VOL, liquid=sample_3)
    source_4.load_liquid(wells=source_4.wells(), volume=SOURCE_TUBE_VOL, liquid=sample_4)

    # Destination pooled wells: each ends up holding 24 x 20 uL = 480 uL
    # of its corresponding sample set. Labeled as empty at the start, since
    # the pooled liquid is only added by the pipetting steps below.
    destination.load_empty(wells=['A1', 'B1', 'C1', 'D1'])

    # Pooling steps (new tip for each tube)
    pipette.transfer(TRANSFER_VOL, source_1.wells(), destination['A1'], new_tip='always')
    pipette.transfer(TRANSFER_VOL, source_2.wells(), destination['B1'], new_tip='always')
    pipette.transfer(TRANSFER_VOL, source_3.wells(), destination['C1'], new_tip='always')
    pipette.transfer(TRANSFER_VOL, source_4.wells(), destination['D1'], new_tip='always')
