def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "volumes_csv", "type": "textFile", "label": "Volumes CSV", "default": "1,2,3"}, {"name": "pip_model", "type": "dropDown", "label": "Pipette Model", "options": [{"label": "P300 Single GEN2", "value": "p300_single_gen2"}, {"label": "P300 Single GEN1", "value": "p300_single"}, {"label": "P20 Single GEN2", "value": "p20_single_gen2"}, {"label": "P50 Single GEN1", "value": "p50_single"}, {"label": "P10 Single GEN1", "value": "p10_single"}, {"label": "P1000 Single GEN2", "value": "p1000_single_gen2"}, {"label": "P1000 Single GEN1", "value": "p1000_single"}]}, {"name": "pip_mount", "type": "dropDown", "label": "Pipette Mount", "options": [{"label": "Right side", "value": "right"}, {"label": "Left side", "value": "left"}]}, {"name": "plate_type", "type": "dropDown", "label": "Plate Type", "options": [{"label": "NEST 96-Well, 200\u00b5L Flat", "value": "nest_96_wellplate_200ul_flat"}, {"label": "NEST 96-Well, 100\u00b5L PCR", "value": "nest_96_wellplate_100ul_pcr_full_skirt"}, {"label": "BioRad 96-Well, 200\u00b5L PCR", "value": "biorad_96_wellplate_200ul_pcr"}, {"label": "Corning 96-Well, 360\u00b5L Flat", "value": "corning_96_wellplate_360ul_flat"}, {"label": "Corning 384-Well, 112\u00b5L Flat", "value": "corning_384_wellplate_112ul_flat"}, {"label": "USA Scientific 96-Deepwell, 2.4mL", "value": "usascientific_96_wellplate_2.4ml_deep"}]}, {"name": "res_type", "type": "dropDown", "label": "Reservoir Type", "options": [{"label": "NEST 1-Well, 195mL", "value": "nest_1_reservoir_195ml"}, {"label": "NEST 12-Well, 15mL", "value": "nest_12_reservoir_15ml"}, {"label": "Agilent 1-Well, 290mL", "value": "agilent_1_reservoir_290ml"}, {"label": "Axygen 1-Well, 90mL", "value": "axygen_1_reservoir_90ml"}, {"label": "USA Scientific 12-Well, 22mL", "value": "usascientific_12_reservoir_22ml"}]}, {"name": "filter_tip", "type": "dropDown", "label": "Use Filter Tips?", "options": [{"label": "No", "value": "no"}, {"label": "Yes", "value": "yes"}]}, {"name": "tip_reuse", "type": "dropDown", "label": "Tip Usage Strategy", "options": [{"label": "Use a new tip for each transfer", "value": "always"}, {"label": "Reuse tip for each transfer", "value": "never"}]}]""")
    return [_all_values[n] for n in names]




metadata = {
    'protocolName': 'Normalization',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.12'
    }

tiprack_slots = ['1', '4', '7', '10']


def transpose_matrix(m):
    return [[r[i] for r in reversed(m)] for i in range(len(m[0]))]


def flatten_matrix(m):
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


def run(protocol):
    [volumes_csv, pip_model, pip_mount, plate_type,
     res_type, filter_tip, tip_reuse] = get_values(  # noqa: F821
        'volumes_csv', 'pip_model', 'pip_mount', 'plate_type',
         'res_type', 'filter_tip', 'tip_reuse')

    # create labware
    plate = protocol.load_labware(plate_type, '3')

    reservoir = protocol.load_labware(res_type, '2')
    source = reservoir.wells()[0]

    pip_size = pip_model.split('_')[0][1:]

    pip_size = '300' if pip_size == '50' else pip_size
    tip_name = 'opentrons_96_tiprack_'+pip_size+'ul'
    if filter_tip == 'yes':
        pip_size = '200' if pip_size == '300' else pip_size
        tip_name = 'opentrons_96_filtertiprack_'+pip_size+'ul'

    tipracks = [protocol.load_labware(tip_name, slot)
                for slot in tiprack_slots]

    pipette = protocol.load_instrument(pip_model, pip_mount,
                                       tip_racks=tipracks)

    # create volumes list
    volumes = [float(cell) for cell in well_csv_to_list(volumes_csv)]

    for vol in volumes:
        if vol < pipette.min_volume:
            protocol.comment(
                'WARNING: volume {} is below pipette\'s minimum volume.'
                .format(vol))

    if tip_reuse == 'never':
        pipette.pick_up_tip()

    for vol, dest in zip(volumes, plate.wells()):
        if vol > 0:
            pipette.transfer(vol, source, dest, new_tip=tip_reuse)

    if pipette.has_tip:
        pipette.drop_tip()
