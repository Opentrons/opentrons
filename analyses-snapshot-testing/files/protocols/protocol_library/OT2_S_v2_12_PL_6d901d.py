def get_values(*names):
    import json
    _all_values = json.loads("""{"volumes_csv": "40,0,12,34,18,56,17,14,42,12,34,18\\n41,23,23,30,23,23,23,23,22,16,23,23\\n56,12,12,34,12,34,12,34,18,18,12,34\\n23,0,23,90,0,90,0,90,23,23,23,90\\n12,0,0,34,23,23,42,13,12,34,32,13\\n23,90,22,90,12,17,23,23,23,0,14,42\\n34,42,64,0,13,90,12,34,13,19,41,19\\n90,21,42,17,21,42,23,0,15,42,19,13", "p300_mount": "right", "p20_mount": "left", "plate_type": "nest_96_wellplate_200ul_flat", "res_type": "usascientific_12_reservoir_22ml", "filter_tip": 0, "tip_reuse": "never"}""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api
from opentrons import types

metadata = {
    'protocolName': 'Normalization with a multi-channel pipette \
     used as a single-channel pipette',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.12'
    }


def transpose_matrix(m):
    return [[r[i] for r in reversed(m)] for i in range(len(m[0]))]


def flatten_matrix(m):
    """ Converts a matrix to a 1D array, e.g. [[1,2],[3,4]] -> [1,2,3,4]
    """
    return [cell for row in m for cell in row]


def well_csv_to_list(csv_string):
    """
    Takes a csv string and flattens it to a list, re-ordering to match
    Opentrons well order convention (A1, B1, C1, ..., A2, B2, B2, ...)
    """
    data = [
        line.split(',')
        for line in reversed(csv_string.split('\n')) if line.strip()
        if line
    ]
    if len(data[0]) > len(data):
        # row length > column length ==> "landscape", so transpose
        return flatten_matrix(transpose_matrix(data))
    # "portrait"
    return flatten_matrix(data)


def run(ctx: protocol_api.ProtocolContext):
    [volumes_csv,
     p300_mount,
     p20_mount,
     plate_type,
     res_type,
     filter_tip,
     tip_reuse] = get_values(  # noqa: F821
     "volumes_csv",
     "p300_mount",
     "p20_mount",
     "plate_type",
     "res_type",
     "filter_tip",
     "tip_reuse")

    # create labware
    source_plate = ctx.load_labware(plate_type, '7')
    # There could be a destination plate in slot 8 for cherry picking
    # Load something tall so the pipette doesn't hit it
    ctx.load_labware('usascientific_96_wellplate_2.4ml_deep', '8')
    reservoir = ctx.load_labware(res_type, '9')
    source = reservoir.wells()[0]
    if filter_tip:
        tips300 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '10')
        tips20 = ctx.load_labware('opentrons_96_filtertiprack_20ul', '11')
    else:
        tips300 = ctx.load_labware('opentrons_96_tiprack_300ul', '10')
        tips20 = ctx.load_labware('opentrons_96_tiprack_20ul', '11')

    m300 = ctx.load_instrument('p300_multi_gen2', p300_mount)
    m20 = ctx.load_instrument('p20_multi_gen2', p20_mount)

    mounted_on = {"left": types.Mount.LEFT, "right": types.Mount.RIGHT}

    pick_up_current = 0.15  # 150 mA for single tip
    ctx._hw_manager.hardware._attached_instruments[
      mounted_on[m20.mount]].update_config_item(
      'pick_up_current', pick_up_current)

    tip300ctr = 95
    tip20ctr = 95

    def pick_up(pip):
        """`pick_up()` will pause the ctx when all tip boxes are out of
        tips, prompting the user to replace all tip racks. Once tipracks are
        reset, the ctx will start picking up tips from the first tip
        box as defined in the slot order when assigning the labware definition
        for that tip box. `pick_up()` will track tips for both pipettes if
        applicable.

        :param pipette: The pipette desired to pick up tip
        as definited earlier in the ctx (e.g. p300, m20).
        """
        nonlocal tip300ctr
        nonlocal tip20ctr

        if pip == m300:
            if tip300ctr < 0:
                ctx.home()
                ctx.pause('Please replace tips for P300 in slot 10.')
                tip300ctr = 95
            m300.pick_up_tip(tips300.wells()[tip300ctr])
            tip300ctr -= 1
        else:
            if tip20ctr < 0:
                ctx.home()
                ctx.pause('Please replace tips for P20 in slot 11.')
                tip20ctr = 95
            m20.pick_up_tip(tips20.wells()[tip20ctr])
            tip20ctr -= 1

    # create volumes list
    volumes = [float(cell) for cell in well_csv_to_list(volumes_csv)]

    is_warning = False

    for vol in volumes:
        if vol < 1:
            ctx.comment(
                'WARNING: volume {} is below pipette\'s minimum volume.'
                .format(vol))
            is_warning = True

    if is_warning:
        ctx.comment("\n")
        ctx.pause(
            "One or more minimum volume warnings were detected "
            "Do you wish to continue?\n")

    for i, vol in enumerate(volumes):
        pipette = m20 if vol <= 20 else m300
        if not pipette.has_tip:
            pick_up(pipette)
        if vol != 0:
            pipette.aspirate(vol, source)
            pipette.dispense(vol, source_plate.wells()[i])
        if tip_reuse == 'never':
            pipette.drop_tip()
