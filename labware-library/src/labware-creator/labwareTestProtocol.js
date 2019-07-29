// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Options } from './fields'

// no P50 for now
const tiprackForPipette = {
  P10_Single: 'opentrons_96_tiprack_10ul',
  // P10_Multi: 'opentrons_96_tiprack_10ul',
  P300_Single: 'opentrons_96_tiprack_300ul',
  // P300_Multi: 'opentrons_96_tiprack_300ul',
  P1000_Single: 'opentrons_96_tiprack_1000ul',
}

export const pipetteNameOptions: Options = Object.keys(tiprackForPipette).map(
  pipetteName => ({ name: pipetteName.replace(/_/g, ' '), value: pipetteName })
)

type LabwareTestProtocolArgs = {|
  pipetteName: string,
  definition: LabwareDefinition2,
|}
const labwareTestProtocol = (args: LabwareTestProtocolArgs): string => {
  const { pipetteName, definition } = args
  const tiprackLoadName = tiprackForPipette[pipetteName]
  const mount = 'right' // NOTE: for now, we'll ONLY use right so that mount-offset issues are reduced

  return `import json
import operator
from opentrons import robot, labware, instruments

TOP_RIGHT_CROSS_COORDS = [380.87, 258.0, 0]
TIPRACK_SLOT = '10'
TEST_LABWARE_SLOT = '5'


def uniq(l):
    res = []
    for i in l:
        if i not in res:
            res.append(i)
    return res


def run_custom_protocol(pipette_name, mount, tiprack_load_name, labware_def):
    tiprack = labware.load(tiprack_load_name, TIPRACK_SLOT)
    pipette = getattr(instruments, pipette_name)(mount, tip_racks=[tiprack])

    test_labware = robot.add_container_by_definition(
        labware_def,
        TEST_LABWARE_SLOT,
        label=labware_def.get('metadata', {}).get(
            'displayName', 'test labware')
    )

    pipette.pick_up_tip()
    pipette.move_to((robot.deck, TOP_RIGHT_CROSS_COORDS))
    robot.pause(f"Confirm {mount} pipette is at slot 9 calibration cross")

    # NOTE: this doesn't work on 1-row reservoir, b/c of WellSeries
    # num_cols = len(test_labware.columns())
    # num_rows = len(test_labware.rows())

    num_cols = len(labware_def.get('ordering', [[]]))
    num_rows = len(labware_def.get('ordering', [[]])[0])

    # use uniq to remove duplicate wells from 1-row and/or 1-column labware
    well_locs = uniq([
        'A1',
        '{}1'.format(chr(ord('A') + num_rows - 1)),
        '{}{}'.format(chr(ord('A') + num_rows - 1), str(num_cols)),
        '{}{}'.format(chr(ord('A') + num_rows - 1), str(num_cols))])

    for well_loc in well_locs:
        well = test_labware.wells(well_loc)
        pipette.move_to(well.bottom())
        robot.pause("Moved to the bottom of the well")
        pipette.move_to(well.top())
        robot.pause("Moved to the top of the well")
        # TODO: is this 0.1mm offset being added here necessary?
        from_center_result1 = tuple(
            map(operator.add, well.from_center(x=-1, y=0, z=1), (0, 0, 0.1)))
        from_center_result2 = tuple(
            map(operator.add, well.from_center(x=0, y=-1, z=1), (0, 0, 0.1)))
        from_center_result3 = tuple(
            map(operator.add, well.from_center(x=1, y=0, z=1), (0, 0, 0.1)))
        from_center_result4 = tuple(
            map(operator.add, well.from_center(x=0, y=1, z=1), (0, 0, 0.1)))
        pipette.move_to((well, from_center_result1))
        robot.pause()
        pipette.move_to(well.top())
        pipette.move_to((well, from_center_result2))
        robot.pause()
        pipette.move_to(well.top())
        pipette.move_to((well, from_center_result3))
        robot.pause()
        pipette.move_to(well.top())
        pipette.move_to((well, from_center_result4))
        robot.pause("Move to the left and top")
        pipette.blow_out(well)


LABWARE_DEF = """${JSON.stringify(definition)}"""

PIPETTE_MOUNT = '${mount}'
PIPETTE_NAME = '${pipetteName}'
TIPRACK_LOADNAME = '${tiprackLoadName}'

run_custom_protocol(PIPETTE_NAME, PIPETTE_MOUNT,
                    TIPRACK_LOADNAME, json.loads(LABWARE_DEF))
`
}

export default labwareTestProtocol
