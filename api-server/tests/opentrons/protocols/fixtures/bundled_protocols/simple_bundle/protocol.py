metadata = {'author': 'MISTER FIXTURE',
            'apiLevel': '2.0'}


def run(protocol_context):
    tip_rack = protocol_context.load_labware('opentrons_96_tiprack_10ul', '3')
    plate = protocol_context.load_labware(
        'custom_labware', '1', namespace='custom_beta')

    pipette = protocol_context.load_instrument('p10_single', 'left',
                                               tip_racks=[tip_rack])

    csv_data = protocol_context.bundled_data['data.txt'].decode('utf-8')

    for volume in csv_data.split(','):
        v = float(volume.strip())
        pipette.transfer(v, plate.wells('A1'), plate.wells('A4'))
