// @flow
import { expectTimelineError } from './testMatchers'
import _aspirate from '../commandCreators/atomic/aspirate'
import { getLabwareDefURI } from '@opentrons/shared-data'
import fixtureTipRack10Ul from '@opentrons/shared-data/labware/fixtures/2/fixtureTipRack10Ul.json'
import fixtureTipRack1000Ul from '@opentrons/shared-data/labware/fixtures/2/fixtureTipRack1000Ul.json'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  commandCreatorHasErrors,
  commandCreatorNoErrors,
} from './fixtures'
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'

jest.mock('../getNextRobotStateAndWarnings')
jest.mock('../../labware-defs/utils') // TODO IMMEDIATELY move to somewhere more general

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
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
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
    invariantContext.pipetteEntities[
      'p300SingleId'
    ].tiprackModel = getLabwareDefURI(fixtureTipRack10Ul)

    invariantContext.pipetteEntities[
      'p300SingleId'
    ].tiprackLabwareDef = fixtureTipRack10Ul

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
    invariantContext.pipetteEntities[
      'p300SingleId'
    ].tiprackModel = getLabwareDefURI(fixtureTipRack1000Ul)

    invariantContext.pipetteEntities[
      'p300SingleId'
    ].tiprackLabwareDef = fixtureTipRack1000Ul

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
