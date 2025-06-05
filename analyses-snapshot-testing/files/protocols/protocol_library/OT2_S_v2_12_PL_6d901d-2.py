def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "transfer_csv", "type": "textFile", "label": "Transfer .csv File", "default": "Source Well,Source Aspiration Height Above Bottom (in mm),Dest Well,Volume (in ul)\\nA1,1,A11,1\\nA1,1,A5,3\\nA1,1,H12,7"}, {"name": "lw_source_plate", "type": "dropDown", "label": "Source Plate Type", "options": [{"label": "NEST 96-Well, 200\u00b5L Flat", "value": "nest_96_wellplate_200ul_flat"}, {"label": "NEST 96-Well, 100\u00b5L PCR", "value": "nest_96_wellplate_100ul_pcr_full_skirt"}, {"label": "BioRad 96-Well, 200\u00b5L PCR", "value": "biorad_96_wellplate_200ul_pcr"}, {"label": "USA Scientific 96-Deepwell, 2.4mL", "value": "usascientific_96_wellplate_2.4ml_deep"}, {"label": "Corning 96-Well, 360\u00b5L Flat", "value": "corning_96_wellplate_360ul_flat"}, {"label": "Corning 384-Well, 112\u00b5L Flat", "value": "corning_384_wellplate_112ul_flat"}, {"label": "Corning Falcon 384-Well, 130 \u00b5L Square, Flat", "value": "corning_falcon_384_well_plate_130ul_square_flat"}, {"label": "Greiner Bio-One 96-well 392 \u00b5L Flat", "value": "greinerbioone_96_wellplate_392ul_flat"}, {"label": "PerkinElmer PhenoPlate 96-well 300 \u00b5L flat", "value": "perkinelmer_phenoplate_96_wellplate_300ul_circular_flat"}]}, {"name": "lw_source_plate_open", "type": "str", "label": "Source plate type (if not listed in dropdown above)", "default": ""}, {"name": "lw_dest_plate", "type": "dropDown", "label": "Destination Plate Type", "options": [{"label": "NEST 96-Well, 200\u00b5L Flat", "value": "nest_96_wellplate_200ul_flat"}, {"label": "NEST 96-Well, 100\u00b5L PCR", "value": "nest_96_wellplate_100ul_pcr_full_skirt"}, {"label": "BioRad 96-Well, 200\u00b5L PCR", "value": "biorad_96_wellplate_200ul_pcr"}, {"label": "USA Scientific 96-Deepwell, 2.4mL", "value": "usascientific_96_wellplate_2.4ml_deep"}, {"label": "Corning 96-Well, 360\u00b5L Flat", "value": "corning_96_wellplate_360ul_flat"}, {"label": "Corning 384-Well, 112\u00b5L Flat", "value": "corning_384_wellplate_112ul_flat"}, {"label": "Corning Falcon 384-Well, 130 \u00b5L Square, Flat", "value": "corning_falcon_384_well_plate_130ul_square_flat"}, {"label": "Greiner Bio-One 96-well 392 \u00b5L Flat", "value": "greinerbioone_96_wellplate_392ul_flat"}, {"label": "PerkinElmer PhenoPlate 96-well 300 \u00b5L flat", "value": "perkinelmer_phenoplate_96_wellplate_300ul_circular_flat"}]}, {"name": "lw_dest_plate_open", "type": "str", "label": "Destination plate type (if not listed in dropdown above)", "default": ""}, {"name": "res_type", "type": "dropDown", "label": "Reservoir Type", "options": [{"label": "USA Scientific 12-Well, 22mL", "value": "usascientific_12_reservoir_22ml"}, {"label": "NEST 1-Well, 195mL", "value": "nest_1_reservoir_195ml"}, {"label": "NEST 12-Well, 15mL", "value": "nest_12_reservoir_15ml"}, {"label": "Agilent 1-Well, 290mL", "value": "agilent_1_reservoir_290ml"}, {"label": "Axygen 1-Well, 90mL", "value": "axygen_1_reservoir_90ml"}, {"label": "None", "value": "none"}]}, {"name": "pipette_type", "type": "dropDown", "label": "Pipette Model", "options": [{"label": "P300 Multi GEN2", "value": "p300_multi_gen2"}, {"label": "P20 Multi GEN2", "value": "p20_multi_gen2"}]}, {"name": "pipette_mount", "type": "dropDown", "label": "Pipette Mount", "options": [{"label": "right", "value": "right"}, {"label": "left", "value": "left"}]}, {"name": "tip_type", "type": "dropDown", "label": "Tip Type", "options": [{"label": "standard", "value": "standard"}, {"label": "filter", "value": "filter"}]}, {"name": "tip_reuse", "type": "dropDown", "label": "Tip Usage Strategy", "options": [{"label": "Use a new tip for each transfer", "value": "never"}, {"label": "Reuse tip for each transfer", "value": "always"}]}, {"name": "starting_tiprack_slot", "type": "str", "label": "Starting Tiprack Slot", "default": "4"}, {"name": "starting_tip_well", "type": "str", "label": "Starting Tip Well", "default": "H1"}]""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api
from opentrons.protocol_api.labware import OutOfTipsError


metadata = {
    'protocolName':
        ('Cherrypicking with multi-channel pipette substituting for a single '
         'channel pipette'),
    'author': 'Nick & Eskil <protocols@opentrons.com>',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.12'
}


def run(ctx: protocol_api.ProtocolContext):

    [transfer_csv,
     lw_source_plate,
     lw_source_plate_open,
     lw_dest_plate,
     lw_dest_plate_open,
     res_type,
     pipette_type,
     pipette_mount,
     tip_type,
     tip_reuse,
     starting_tiprack_slot,
     starting_tip_well] = get_values(  # noqa: F821
     "transfer_csv",
     "lw_source_plate",
     "lw_source_plate_open",
     "lw_dest_plate",
     "lw_dest_plate_open",
     "res_type",
     "pipette_type",
     "pipette_mount",
     "tip_type",
     "tip_reuse",
     "starting_tiprack_slot",
     "starting_tip_well")

    tiprack_map = {
        'p20_multi_gen2': {
            'standard': 'opentrons_96_tiprack_20ul',
            'filter': 'opentrons_96_filtertiprack_20ul'
        },
        'p300_multi_gen2': {
            'standard': 'opentrons_96_tiprack_300ul',
            'filter': 'opentrons_96_filtertiprack_200ul'
        }
    }

    # Parse csv
    # Format: Source Well, Source Aspiration Height Above Bottom (in mm),
    # Dest Well, Volume (in ul)
    transfer_info = [[val.strip().lower() for val in line.split(',')]
                     for line in transfer_csv.splitlines()
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
    dest_plate = ctx.load_labware(lw_dest_plate_name, '8')
    # This reservoir is unused, but present
    if res_type != "none":
        ctx.load_labware(res_type, '9')

    # Load tipracks
    tip_name = tiprack_map[pipette_type][tip_type]
    tiprack_slots = ['4', '5', '10', '11']
    tipracks = [ctx.load_labware(tip_name, slot)
                for slot in tiprack_slots]

    # load pipette
    pip = ctx.load_instrument(pipette_type, pipette_mount, tip_racks=tipracks)

    if 'p20' in pipette_type:
        pick_up_current = 0.15
        ctx._hw_manager.hardware._attached_instruments[
          pip._implementation.get_mount()].update_config_item(
          'pick_up_current', pick_up_current)

    # Tip_map has the columns reversed, pipette always picks up the
    # bottom-most tip in a given column until the column is depleted, and then
    # moves to the next column (from left to right).
    tip_map = []
    for rack in tipracks:
        tip_map.append(
            [[col for col in reversed(column)] for column in rack.columns()])
    # Flag at the end of each rack that is true if there are tips left
    for rack in tip_map:
        rack.append(True)
    # Flag used tipracks based on the protocol input parameter.
    # Check that the input parameter is an existing tiprack slot
    if starting_tiprack_slot not in tiprack_slots:
        raise Exception(
            f"The Starting Tiprack Slot ({starting_tiprack_slot}) is invalid "
            f"The valid tiprack slots are {tiprack_slots}"
        )
    start_rack_index = tiprack_slots.index(starting_tiprack_slot)
    for i in range(start_rack_index):
        tip_map[i][-1] = False

    # Flag used tips in the first available tiprack
    for column in tip_map[start_rack_index]:
        is_break = False
        for well in column:
            if well.well_name != starting_tip_well:
                well.has_tip = False
            else:
                is_break = True
                break
        if is_break:
            break

    def pick_up(pipette):
        """`pick_up()` will pause the ctx when all tip boxes are out of
        tips, prompting the user to replace all tip racks. Once tipracks are
        reset, the ctx will start picking up tips from the first tip
        box as defined in the slot order when assigning the labware definition
        for that tip box. `pick_up()` will track tips for both pipettes if
        applicable.

        :param pipette: The pipette desired to pick up tip
        as definited earlier in the ctx (e.g. p300, m20).
        """
        for i, rack in enumerate(tip_map):
            # Check the flag to see if the rack is empty, then we don't loop
            # through that rack so that the algorithm executes faster.
            if rack[-1] is False:
                if i == len(tip_map) - 1:  # All tips are used, time to reset
                    ctx.pause("Replace empty tip racks")
                    # print("Replace empty tip racks")
                    pipette.reset_tipracks()
                    for rack in tip_map:
                        rack[-1] = True
                    # Raise an exception so that we can retry the pick up
                    raise OutOfTipsError(
                        "Tipracks were out of tips and were reset")
                else:
                    continue
            for column in rack[:-1]:  # skip [-1] index because it's the flag
                for well in column:
                    if well.has_tip:
                        pipette.pick_up_tip(well)
                        if well.well_name == 'A12':  # last tip in the rack
                            rack[-1] = False
                        return

    def parse_well(well):
        letter = well[0]
        number = well[1:]
        return letter.upper() + str(int(number))

    # import pdb; pdb.set_trace()
    if tip_reuse == 'always':
        try:
            pick_up(pip)
        except OutOfTipsError:
            # Try again after tipracks are reset
            pick_up(pip)
    for line in transfer_info:
        s_well, h, d_well, vol = line[:4]
        source_locn = \
            source_plate.wells_by_name()[parse_well(s_well)].bottom(float(h))
        dest_locn = \
            dest_plate.wells_by_name()[parse_well(d_well)]
        if tip_reuse == 'never':
            try:
                pick_up(pip)
            except OutOfTipsError:
                # Try again after tipracks are reset
                pick_up(pip)
        # pip.transfer(float(vol), source_locn, dest_locn, new_tip='never')
        pip.aspirate(float(vol), source_locn)
        pip.dispense(float(vol), dest_locn)
        if tip_reuse == 'never':
            pip.drop_tip()
    if pip.has_tip:
        pip.drop_tip()
