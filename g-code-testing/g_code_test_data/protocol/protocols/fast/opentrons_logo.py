def get_values(*names):
    import json
    _all_values = json.loads(
        """
        {
            "pip_model": "p300_single_gen2",
            "pip_mount":"right",
            "dp_type":"nest_96_wellplate_200ul_flat",
            "dye_type":"usascientific_12_reservoir_22ml"
        }
        """
    )
    return [_all_values[n] for n in names]


metadata = {
    'protocolName': 'Opentrons Logo',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.2'
    }


def run(protocol):
    [pip_model, pip_mount, dp_type, dye_type] = get_values(  # noqa: F821
        'pip_model', 'pip_mount', 'dp_type', 'dye_type')

    # create pipette and tiprack
    tip_size = pip_model.split('_')[0][1:]
    tip_size = '300' if tip_size == '50' else tip_size
    tip_name = 'opentrons_96_tiprack_'+tip_size+'ul'

    protocol.home()

    tips = [protocol.load_labware(tip_name, '1', 'Opentrons Tips')]

    pipette = protocol.load_instrument(
        pip_model, pip_mount, tip_racks=tips)

    # create plates and pattern list
    output = protocol.load_labware(dp_type, '3', 'Destination Plate')

    dye_container = protocol.load_labware(dye_type, '2', 'Dye Source')

    # Well Location set-up
    dye1_wells = ['A5', 'A6', 'A8', 'A9', 'B4', 'B10', 'C3', 'C11', 'D3',
                  'D11', 'E3', 'E11', 'F3', 'F11', 'G4', 'G10',
                  'H5', 'H6', 'H7', 'H8', 'H9']

    dye2_wells = ['C7', 'D6', 'D7', 'D8', 'E5', 'E6', 'E7', 'E8',
                  'E9', 'F5', 'F6', 'F7', 'F8', 'F9', 'G6', 'G7', 'G8']

    dye2 = dye_container['A1']
    dye1 = dye_container['A2']

    dye_vol = 100 if tip_size == '1000' else 50

    pipette.distribute(
        dye_vol,
        dye1,
        [output.wells_by_name()[well_name] for well_name in dye1_wells],
        new_tip='once')
    pipette.distribute(
        dye_vol,
        dye2,
        [output.wells_by_name()[well_name] for well_name in dye2_wells],
        new_tip='once')