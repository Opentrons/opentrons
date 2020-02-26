// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Options } from './fields'

const pipettes = {
  'P20 Single GEN2': {
    loadName: 'p20_single_gen2',
    tiprack: 'opentrons_96_tiprack_10ul',
  },
  'P300 Single GEN2': {
    loadName: 'p300_single_gen2',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  'P1000 Single GEN2': {
    loadName: 'p1000_single_gen2',
    tiprack: 'opentrons_96_tiprack_1000ul',
  },
  'P10 Single GEN1': {
    loadName: 'p10_single',
    tiprack: 'opentrons_96_tiprack_10ul',
  },
  'P50 Single GEN1': {
    loadName: 'p50_single',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  'P300 Single GEN1': {
    loadName: 'p300_single',
    tiprack: 'opentrons_96_tiprack_300ul',
  },
  'P1000 Single GEN1': {
    loadName: 'p1000_single',
    tiprack: 'opentrons_96_tiprack_1000ul',
  },
}

export const pipetteNameOptions: Options = Object.keys(pipettes).map(
  pipetteName => ({ name: pipetteName, value: pipetteName })
)

type LabwareTestProtocolArgs = {|
  pipetteName: string,
  definition: LabwareDefinition2,
|}

export const labwareTestProtocol = ({
  pipetteName,
  definition,
}: LabwareTestProtocolArgs): string => {
  const instrumentName = pipettes[pipetteName].loadName
  const tiprackLoadName = pipettes[pipetteName].tiprack
  const mount = 'right' // NOTE: for now, we'll ONLY use right so that mount-offset issues are reduced

  return `import json
from opentrons import protocol_api, types

CALIBRATION_CROSS_COORDS = {
    '1': {
        'x': 12.13,
        'y': 9.0,
        'z': 0.0
    },
    '3': {
        'x': 380.87,
        'y': 9.0,
        'z': 0.0
    },
    '7': {
        'x': 12.13,
        'y': 258.0,
        'z': 0.0
    }
}
CALIBRATION_CROSS_SLOTS = ['1', '3', '7']
TEST_LABWARE_SLOT = '3'

RATE = 0.25  # % of default speeds
SLOWER_RATE = 0.1

PIPETTE_MOUNT = '${mount}'
PIPETTE_NAME = '${instrumentName}'

TIPRACK_SLOT = '5'
TIPRACK_LOADNAME = '${tiprackLoadName}'

LABWARE_DEF_JSON = """${JSON.stringify(definition)}"""
LABWARE_DEF = json.loads(LABWARE_DEF_JSON)
LABWARE_LABEL = LABWARE_DEF.get('metadata', {}).get(
    'displayName', 'test labware')

metadata = {'apiLevel': '2.0'}


def uniq(l):
    res = []
    for i in l:
        if i not in res:
            res.append(i)
    return res

def run(protocol: protocol_api.ProtocolContext):
    tiprack = protocol.load_labware(TIPRACK_LOADNAME, TIPRACK_SLOT)
    pipette = protocol.load_instrument(
        PIPETTE_NAME, PIPETTE_MOUNT, tip_racks=[tiprack])

    test_labware = protocol.load_labware_from_definition(
        LABWARE_DEF,
        TEST_LABWARE_SLOT,
        LABWARE_LABEL,
    )

    num_cols = len(LABWARE_DEF.get('ordering', [[]]))
    num_rows = len(LABWARE_DEF.get('ordering', [[]])[0])
    well_locs = uniq([
        'A1',
        '{}{}'.format(chr(ord('A') + num_rows - 1), str(num_cols))])

    pipette.pick_up_tip()

    def set_speeds(rate):
        protocol.max_speeds.update({
            'X': (600 * rate),
            'Y': (400 * rate),
            'Z': (125 * rate),
            'A': (125 * rate),
        })

        speed_max = max(protocol.max_speeds.values())

        for instr in protocol.loaded_instruments.values():
            instr.default_speed = speed_max

    set_speeds(RATE)

    for slot in CALIBRATION_CROSS_SLOTS:
        coordinate = CALIBRATION_CROSS_COORDS[slot]
        location = types.Location(point=types.Point(**coordinate),
                                  labware=None)
        pipette.move_to(location)
        protocol.pause(
            f"Confirm {PIPETTE_MOUNT} pipette is at slot {slot} calibration cross")

    pipette.home()
    protocol.pause(f"Place your labware in Slot {TEST_LABWARE_SLOT}")

    for well_loc in well_locs:
        well = test_labware.well(well_loc)
        all_4_edges = [
            [well._from_center_cartesian(x=-1, y=0, z=1), 'left'],
            [well._from_center_cartesian(x=1, y=0, z=1), 'right'],
            [well._from_center_cartesian(x=0, y=-1, z=1), 'front'],
            [well._from_center_cartesian(x=0, y=1, z=1), 'back']
        ]

        set_speeds(RATE)
        pipette.move_to(well.top())
        protocol.pause("Moved to the top of the well")

        for edge_pos, edge_name in all_4_edges:
            set_speeds(SLOWER_RATE)
            edge_location = types.Location(point=edge_pos, labware=None)
            pipette.move_to(edge_location)
            protocol.pause(f'Moved to {edge_name} edge')

        set_speeds(RATE)
        pipette.move_to(well.bottom())
        protocol.pause("Moved to the bottom of the well")

        pipette.blow_out(well)

    set_speeds(1.0)
    pipette.return_tip()
`
}
