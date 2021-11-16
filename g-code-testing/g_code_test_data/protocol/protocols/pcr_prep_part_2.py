def get_values(*names):
    import json
    _all_values = json.loads("""{"number_of_samples":96,"right_pipette":"p300_multi_gen2","left_pipette":"p300_multi_gen2","mastermix_volume":18,"DNA_volume":2}""")
    return [_all_values[n] for n in names]


import math

metadata = {
    'protocolName': 'PCR Prep',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.2'
    }


def run(protocol_context):

    protocol_context.home()

    [number_of_samples, left_pipette, right_pipette, mastermix_volume,
     DNA_volume] = get_values(  # noqa: F821
        "number_of_samples", "left_pipette", 'right_pipette',
        "mastermix_volume", "DNA_volume"
     )

    if not left_pipette and not right_pipette:
        raise Exception('You have to select at least 1 pipette.')

    pipette_l = None
    pipette_r = None

    for pip, mount, slots in zip(
            [left_pipette, right_pipette],
            ['left', 'right'],
            [['5', '6'], ['7', '8']]):

        if pip:
            range = pip.split('_')[0][1:]
            rack = 'opentrons_96_tiprack_' + range + 'ul'
            tipracks = [
                protocol_context.load_labware(rack, slot) for slot in slots]
            if mount == 'left':
                pipette_l = protocol_context.load_instrument(
                    pip, mount, tip_racks=tipracks)
            else:
                pipette_r = protocol_context.load_instrument(
                    pip, mount, tip_racks=tipracks)

    # labware setup
    dna_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '1', 'DNA plate')
    dest_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '2', 'Output plate')
    res12 = protocol_context.load_labware(
        'usascientific_12_reservoir_22ml', '3', 'reservoir')

    # determine which pipette has the smaller volume range
    if pipette_l and pipette_r:
        if left_pipette == right_pipette:
            pip_s = pipette_l
            pip_l = pipette_r
        else:
            if pipette_l.max_volume < pipette_r.max_volume:
                pip_s, pip_l = pipette_l, pipette_r
            else:
                pip_s, pip_l = pipette_r, pipette_l
    else:
        pipette = pipette_l if pipette_l else pipette_r

    # reagent setup
    mastermix = res12.wells()[0]

    col_num = math.ceil(number_of_samples/8)

    # distribute mastermix
    if pipette_l and pipette_r:
        if mastermix_volume <= pip_s.max_volume:
            pipette = pip_s
        else:
            pipette = pip_l
    pipette.pick_up_tip()
    for dest in dest_plate.rows()[0][:col_num]:
        pipette.transfer(
            mastermix_volume,
            mastermix,
            dest_plate.rows()[0][:col_num],
            new_tip='never'
        )
        pipette.blow_out(mastermix.top())
    pipette.drop_tip()

    # transfer DNA
    if pipette_l and pipette_r:
        if DNA_volume <= pip_s.max_volume:
            pipette = pip_s
        else:
            pipette = pip_l
    for source, dest in zip(dna_plate.rows()[0][:col_num],
                            dest_plate.rows()[0][:col_num]):
        pipette.transfer(DNA_volume, source, dest)