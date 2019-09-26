def run(protocol_context):
    tip_rack = protocol_context.load_labware('opentrons_96_tiprack_10ul', '3')
    plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '1')

    pipette = protocol_context.load_instrument('p10_single', 'left',
                                               tip_racks=[tip_rack])

    pipette.transfer(5, plate.wells('A1'), plate.wells('B1'))
