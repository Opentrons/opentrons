// @flow
import { expectTimelineError } from './testMatchers'
import aspirate from '../commandCreators/atomic/aspirate'
import { getLabwareDefURI } from '@opentrons/shared-data'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'

jest.mock('../getNextRobotStateAndWarnings')
jest.mock('../../labware-defs/utils') // TODO IMMEDIATELY move to somewhere more general

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
  let flowRateAndOffsets

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
    flowRateAndOffsets = {
      flowRate: 6,
      offsetFromBottomMm: 5,
    }
  })

  test('aspirate normally (with tip)', () => {
    const params = {
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    }

    const result = aspirate(params)(invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        command: 'aspirate',
        params,
      },
    ])
  })

  test('aspirate with volume > tip max volume should throw error', () => {
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixture_tiprack_10_ul)

    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixture_tiprack_10_ul

    const result = aspirate({
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 201,
      labware: SOURCE_LABWARE,
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with volume > pipette max volume should throw error', () => {
    // NOTE: assigning p300 to a 1000uL tiprack is nonsense, just for this test
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixture_tiprack_1000_ul)

    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixture_tiprack_1000_ul

    const result = aspirate({
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 301,
      labware: SOURCE_LABWARE,
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with invalid pipette ID should return error', () => {
    const result = aspirate({
      ...flowRateAndOffsets,
      pipette: 'badPipette',
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('aspirate with no tip should return error', () => {
    const result = aspirate({
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    })(invariantContext, initialRobotState)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  test('aspirate from nonexistent labware should return error', () => {
    const result = aspirate({
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: 'problematicLabwareId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  describe('liquid tracking', () => {
    test('aspirate calls getNextRobotStateAndWarnings with correct args and puts result into robotState', () => {
      const args = {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
        volume: 152,
      }
      const result = aspirate(args)(invariantContext, robotStateWithTip)

      expect(getNextRobotStateAndWarnings).toHaveBeenCalledWith(
        getSuccessResult(result).commands[0],
        invariantContext,
        robotStateWithTip
      )
      expect(getSuccessResult(result).robotState).toBe(
        mockRobotStateAndWarningsReturnValue.robotState
      )
      expect(getSuccessResult(result).warnings).toBe(
        mockRobotStateAndWarningsReturnValue.warnings
      )
    })
  })
})
