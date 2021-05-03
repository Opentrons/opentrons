// @flow
import { expectTimelineError } from '../__utils__/testMatchers'
import { moveToWell } from '../commandCreators/atomic/moveToWell'
import { thermocyclerPipetteCollision } from '../utils'
import {
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../__fixtures__'
import type { RobotState } from '../'

jest.mock('../utils/thermocyclerPipetteCollision')

const mockThermocyclerPipetteCollision: JestMockFn<
  [
    $PropertyType<RobotState, 'modules'>,
    $PropertyType<RobotState, 'labware'>,
    string
  ],
  boolean
> = thermocyclerPipetteCollision

describe('moveToWell', () => {
  let robotStateWithTip
  let invariantContext

  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return a moveToWell command given only the required params', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
    }

    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        command: 'moveToWell',
        params,
      },
    ])
  })

  it('should apply the optional params to the command', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
      offset: { x: 1, y: 2, z: 3 },
      minimumZHeight: 5,
      forceDirect: true,
    }

    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        command: 'moveToWell',
        params,
      },
    ])
  })

  it('should return an error if pipette does not exist', () => {
    const result = moveToWell(
      {
        pipette: 'badPipette',
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )

    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  it('should return error if labware does not exist', () => {
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: 'problematicLabwareId',
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  it('should return an error when moving to well in a thermocycler with pipette collision', () => {
    mockThermocyclerPipetteCollision.mockImplementationOnce(
      (
        modules: $PropertyType<RobotState, 'modules'>,
        labware: $PropertyType<RobotState, 'labware'>,
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })
})
