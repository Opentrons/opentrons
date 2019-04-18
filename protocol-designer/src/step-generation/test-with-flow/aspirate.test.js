// @flow
import { expectTimelineError } from './testMatchers'
import _aspirate from '../commandCreators/atomic/aspirate'
import {
  makeContext,
  makeState,
  commandCreatorHasErrors,
  commandCreatorNoErrors,
} from './fixtures'
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'

jest.mock('../getNextRobotStateAndWarnings')
jest.mock('../../labware-defs/utils') // TODO IMMEDIATELY move to somewhere more general

// TODO Ian 2019-04-12: create representative fixtures, don't use real defs
const fixtureTiprack10ul = require('@opentrons/shared-data/definitions2/opentrons_96_tiprack_10_ul.json')

const aspirate = commandCreatorNoErrors(_aspirate)
const aspirateWithErrors = commandCreatorHasErrors(_aspirate)

const mockRobotStateAndWarningsReturnValue = {
  // using strings instead of properly-shaped objects for easier assertions
  robotState: 'expected robot state',
  warnings: 'expected warnings',
}

beforeEach(() => {
  // $FlowFixMe
  getNextRobotStateAndWarnings.mockReturnValue(
    mockRobotStateAndWarningsReturnValue
  )
})

describe('aspirate', () => {
  let initialRobotState
  let robotStateWithTip
  let invariantContext

  beforeEach(() => {
    // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
    invariantContext = makeContext()
    const makeStateArgs = {
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        sourcePlateId: { slot: '2' },
      },
    }
    initialRobotState = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: true },
    })
    robotStateWithTip = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: false },
    })
    robotStateWithTip.tipState.pipettes.p300SingleId = true
  })

  describe('aspirate normally (with tip)', () => {
    const optionalArgsCases = [
      {
        description: 'no optional args',
        expectInParams: false,
        args: {},
      },
      {
        description: 'null optional args',
        expectInParams: false,
        args: {
          offsetFromBottomMm: null,
          'flow-rate': null,
        },
      },
      {
        description: 'all optional args',
        expectInParams: true,
        args: {
          offsetFromBottomMm: 5,
          'flow-rate': 6,
        },
      },
    ]

    optionalArgsCases.forEach(testCase => {
      test(testCase.description, () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 50,
          labware: 'sourcePlateId',
          well: 'A1',
          ...testCase.args,
        })(invariantContext, robotStateWithTip)

        expect(result.commands).toEqual([
          {
            command: 'aspirate',
            params: {
              pipette: 'p300SingleId',
              volume: 50,
              labware: 'sourcePlateId',
              well: 'A1',
              ...(testCase.expectInParams ? testCase.args : {}),
            },
          },
        ])
      })
    })
  })

  test('aspirate with volume > tip max volume should throw error', () => {
    // TODO IMMEDIATELY cleaner way to make invariantContext??
    invariantContext.pipetteEntities['p300SingleId'].tiprackModel =
      fixtureTiprack10ul.otId
    invariantContext.pipetteEntities[
      'p300SingleId'
    ].tiprackLabwareDef = fixtureTiprack10ul
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 201,
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with volume > pipette max volume should throw error', () => {
    // NOTE: assigning p300 to a 1000uL tiprack is nonsense, just for this test
    robotStateWithTip.pipettes['p300SingleId'].tiprackModel = 'tiprack-1000ul'
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 301,
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with invalid pipette ID should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'badPipette',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expectTimelineError(result.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('aspirate with no tip should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, initialRobotState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  test('aspirate from nonexistent labware should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'problematicLabwareId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  describe('liquid tracking', () => {
    test('aspirate calls getNextRobotStateAndWarnings with correct args and puts result into robotState', () => {
      const args = {
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
      }
      const result = aspirate(args)(invariantContext, robotStateWithTip)

      expect(getNextRobotStateAndWarnings).toHaveBeenCalledWith(
        result.commands[0],
        invariantContext,
        robotStateWithTip
      )
      expect(result.robotState).toBe(
        mockRobotStateAndWarningsReturnValue.robotState
      )
      expect(result.warnings).toBe(
        mockRobotStateAndWarningsReturnValue.warnings
      )
    })
  })
})
