// @flow
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import { modulePipetteCollision } from '../utils/modulePipetteCollision'
import { getInitialRobotStateStandard, makeContext } from '../__fixtures__'
import { _getFeatureFlag } from '../utils/_getFeatureFlag'
jest.mock('../utils/_getFeatureFlag')

const mock_getFeatureFlag: JestMockFn<[string], boolean> = _getFeatureFlag

let invariantContext
let robotState
let collisionArgs
beforeEach(() => {
  jest.clearAllMocks()
  mock_getFeatureFlag.mockReturnValue(false)

  invariantContext = makeContext()
  invariantContext.moduleEntities['magDeckId'] = {
    id: 'magDeckId',
    type: MAGNETIC_MODULE_TYPE,
    model: MAGNETIC_MODULE_V1,
  }
  robotState = getInitialRobotStateStandard(invariantContext)
  robotState.labware['destPlateId'].slot = '4'
  robotState.labware['tiprack1Id'].slot = '10'
  robotState.modules['magDeckId'] = {
    slot: '1',
    moduleState: { type: MAGNETIC_MODULE_TYPE, engaged: false },
  }

  collisionArgs = {
    pipette: 'p10MultiId',
    labware: 'destPlateId',
    invariantContext,
    prevRobotState: robotState,
  }
})

describe('modulePipetteCollision', () => {
  it('should return true if using a GEN1 multi pipette "north" of a GEN1 magnetic module', () => {
    expect(modulePipetteCollision(collisionArgs)).toBe(true)
  })

  it('should return false under the same conditions, if OT_PD_DISABLE_MODULE_RESTRICTIONS flag is enabled', () => {
    mock_getFeatureFlag.mockReturnValue(true)
    expect(modulePipetteCollision(collisionArgs)).toBe(false)
    expect(mock_getFeatureFlag).toHaveBeenCalledWith(
      'OT_PD_DISABLE_MODULE_RESTRICTIONS'
    )
  })

  it('should return false with no labware', () => {
    expect(
      modulePipetteCollision({
        ...collisionArgs,
        labware: null,
      })
    ).toBe(false)
  })

  it('should return false with no pipette', () => {
    expect(
      modulePipetteCollision({
        ...collisionArgs,
        pipette: null,
      })
    ).toBe(false)
  })

  it('should return false when module is GEN2', () => {
    invariantContext.moduleEntities['magDeckId'].model = MAGNETIC_MODULE_V2
    expect(
      modulePipetteCollision({
        pipette: 'p10MultiId',
        labware: 'destPlateId',
        invariantContext,
        prevRobotState: robotState,
      })
    ).toBe(false)
  })
})
