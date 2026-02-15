def get_values(*names):
    import json
    _all_values = json.loads("""{"transfer_csv_cherry": "Source Well,Source Aspiration Height Above Bottom (in mm),Dest Well,Volume (in ul)\\nA1,1,A11,1\\nA1,1,A5,3\\nA1,1,H12,7", "volumes_csv": "40,0,12,34,18,56,17,14,42,12,34,18\\n41,23,23,30,23,23,23,23,22,16,23,23\\n56,12,12,34,12,34,12,34,18,18,12,34\\n23,0,23,90,0,90,0,90,23,23,23,90\\n12,0,0,34,23,23,42,13,12,34,32,13\\n23,90,22,90,12,17,23,23,23,0,14,42\\n34,42,64,0,13,90,12,34,13,19,41,19\\n90,21,42,17,21,42,23,0,15,42,19,13", "lw_source_plate": "nest_96_wellplate_200ul_flat", "lw_source_plate_open": "", "lw_dest_plate": "nest_96_wellplate_200ul_flat", "lw_dest_plate_open": "", "res_type": "usascientific_12_reservoir_22ml", "m300_mount": "left", "m20_mount": "right", "m300_tip_type": "opentrons_96_tiprack_300ul", "m20_tip_type": "opentrons_96_tiprack_20ul", "starting_tip_well_20": "H12", "starting_tip_well_300": "H12"}""")
    return [_all_values[n] for n in names]


# noqa: flake8
from opentrons import protocol_api
from opentrons.types import Mount


metadata = {
    'protocolName':
        ('Cherrypicking with multi-channel pipette substituting for a single '
         'channel pipette'),
    'author': 'Nick & Eskil & Rami <protocols@opentrons.com>',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.15'
}


def run(ctx: protocol_api.ProtocolContext):

    [transfer_csv_cherry,
     volumes_csv,
     lw_source_plate,
     lw_source_plate_open,
     lw_dest_plate,
     lw_dest_plate_open,
     res_type,
     m300_mount,
     m20_mount,
     m300_tip_type,
     m20_tip_type,
     starting_tip_well_20,
     starting_tip_well_300
     ] = get_values(  # noqa: F821
     "transfer_csv_cherry",
     "volumes_csv",
     "lw_source_plate",
     "lw_source_plate_open",
     "lw_dest_plate",
     "lw_dest_plate_open",
     "res_type",
     "m300_mount",
     "m20_mount",
     "m300_tip_type",
     "m20_tip_type",
     "starting_tip_well_20",
     "starting_tip_well_300")

#     transfer_csv_cherry = '''
# Source Well,Source Aspiration Height Above Bottom (in mm),Dest Well,Volume (in ul)
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
# A1,1,A11,1
# A1,1,A5,0.0
# A1,1,H12,23
#     '''
#
#     volumes_csv = """40,0,12,34,18,56,17,14,42,12,34,18\n41,23,23,30,23,23,23,23,22,16,23,23\n56,12,12,34,12,34,12,34,18,18,12,34\n23,0,23,90,0,90,0,90,23,23,23,90\n12,0,0,34,23,23,42,13,12,34,32,13\n23,90,22,90,12,17,23,23,23,0,14,42\n34,42,64,0,13,90,12,34,13,19,41,19\n90,21,42,17,21,42,23,0,15,42,19,13"""
#     lw_source_plate = 'nest_96_wellplate_200ul_flat'
#     lw_source_plate_open = ''
#     lw_dest_plate = 'nest_96_wellplate_200ul_flat'
#     lw_dest_plate_open = ''
#     res_type = 'usascientific_12_reservoir_22ml'
#     m300_mount = 'left'
#     m20_mount = 'right'
#     m300_tip_type = 'opentrons_96_filtertiprack_200ul'
#     m20_tip_type = 'opentrons_96_filtertiprack_20ul'
#
#     starting_tip_well_20 ='A1'
#     starting_tip_well_300 = 'A1'



    transfer_info_cherry = [[val.strip().lower() for val in line.split(',')]
                            for line in transfer_csv_cherry.splitlines()
                            if line.split(',')[0].strip()][1:]

    if lw_source_plate_open.strip():
        lw_source_plate_name = lw_source_plate_open
    else:
        lw_source_plate_name = lw_source_plate
    if lw_dest_plate_open.strip():
        lw_dest_plate_name = lw_dest_plate_open
    else:
        lw_dest_plate_name = lw_dest_plate

    # Load labware
    #  Plate to cherrypick from
    source_plate = ctx.load_labware(lw_source_plate_name, '7')
    dest_plate = ctx.load_labware(lw_dest_plate_name, '4')
    # This reservoir is unused, but present
    reservoir = ctx.load_labware(res_type, '2')
    source = reservoir.wells()[0]

    # Load tipracks

    tips20 = [ctx.load_labware(m20_tip_type, slot)
              for slot in ['11', '10']]
    tips300 = [ctx.load_labware(m300_tip_type, slot)
               for slot in ['6', '5']]

    # load pipette
    m300 = ctx.load_instrument('p300_multi_gen2', m300_mount,
                               tip_racks=tips300)
    m20 = ctx.load_instrument('p20_multi_gen2', m20_mount,
                              tip_racks=tips20)

    tip_reuse_norm = 'always'
    tip_reuse_cherry = 'never'

    sample_liq = ctx.define_liquid(
        name="Sample",
        description="Sample",
        display_color="#7EFF42",
        )

    diluent_liq = ctx.define_liquid(
        name="Diluent",
        description="Diluent",
        display_color="#50D5FF",
    )

    for well in source_plate.wells():
        well.load_liquid(liquid=sample_liq, volume=200)

    source.load_liquid(liquid=diluent_liq, volume=200)

    if not ctx.is_simulating():
        pick_up_current = 0.1  # 100 mA for single tip
        # Uncomment the next two lines if using Opentrons Robot Software version 7.1.x. # noqa: E501
        # Comment them if NOT using 7.1.x

        # ctx._hw_manager.hardware.get_pipette(Mount.string_to_mount(pip.mount)).update_config_item(  # noqa: E501
        #       {'pick_up_current': {8: pick_up_current}})

        # Uncomment the next two lines if using Opentrons Robot Software version 7.2.x # noqa: E501
        # Comment them if NOT using 7.2.x

        ctx._hw_manager.hardware.get_pipette(Mount.string_to_mount(m300.mount)).update_config_item(
              {'pick_up_current': pick_up_current})
        ctx._hw_manager.hardware.get_pipette(Mount.string_to_mount(m20.mount)).update_config_item(
              {'pick_up_current': pick_up_current})

    num_chan = 1
    tips_ordered300 = [
        tip
        for rack in tips300
        for col in rack.columns()[
            len(rack.columns())-num_chan::-1*num_chan]
        for tip in col[::-1]]

    tips_ordered20 = [
        tip
        for rack in tips20
        for col in rack.columns()[
            len(rack.columns())-num_chan::-1*num_chan]
        for tip in col[::-1]]

    starting_tip_300 = 0
    for tip_name in tips_ordered300:
        all_words = str(tip_name).split()
        if all_words[0] == starting_tip_well_300:
            break
        else:
            starting_tip_300 += 1

    starting_tip_20 = 0
    for tip_name in tips_ordered20:
        all_words = str(tip_name).split()
        if all_words[0] == starting_tip_well_20:
            break
        else:
            starting_tip_20 += 1

    tip_count300 = starting_tip_300
    tip_count20 = starting_tip_20

    def pick_up(pip):

        nonlocal tip_count20
        nonlocal tip_count300
        if pip == m20:
            m20.pick_up_tip(tips_ordered20[tip_count20])
            tip_count20 += 1
        else:
            m300.pick_up_tip(tips_ordered300[tip_count300])
            tip_count300 += 1

    def parse_well(well):
        letter = well[0]
        number = well[1:]
        return letter.upper() + str(int(number))

    # COMBINING CODE FROM 6D901D TO MAKE ONE LARGE PROTOCOL

    # NORMALIZATION PROTOCOL

    def transpose_matrix(m):
        return [[r[i] for r in reversed(m)] for i in range(len(m[0]))]

    def flatten_matrix(m):
        """ Converts a matrix to a 1D array, e.g. [[1,2],[3,4]] -> [1,2,3,4]
        """
        return [cell for row in m for cell in row]

    def well_csv_to_list(csv_string):
        """
        Takes a csv string and flattens to a list, re-ordering to match
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
            pipette.dispense(vol, dest_plate.wells()[i])
        if tip_reuse_norm == 'never':
            pipette.drop_tip()

    ####################### CHERRYPICKING PROTOCOL #########################

    # if tip_reuse == 'always':
    #     pick_up(pip)

    ctx.comment('\n\n\n\n\n\n\n\n')
    if m20.has_tip:
        m20.drop_tip()
    if m300.has_tip:
        m300.drop_tip()

    for line in transfer_info_cherry:
        s_well, h, d_well, vol = line[:4]
        if float(vol) == 0:
            continue
        pip = m20 if float(vol) <= 20 else m300
        # if tip_reuse_cherry == 'always' and not pip.has_tip:
        #     pick_up(pip)

        source_locn = \
            source_plate.wells_by_name()[parse_well(s_well)].bottom(float(h))
        dest_locn = \
            dest_plate.wells_by_name()[parse_well(d_well)]

        if tip_reuse_cherry == 'never':
            pick_up(pip)

        # pip.transfer(float(vol), source_locn, dest_locn, new_tip='never')
        pip.aspirate(float(vol), source_locn)
        pip.dispense(float(vol), dest_locn)
        if tip_reuse_cherry == 'never':
            pip.drop_tip()
    if m20.has_tip:
        m20.drop_tip()
    if m300.has_tip:
        m300.drop_tip()
