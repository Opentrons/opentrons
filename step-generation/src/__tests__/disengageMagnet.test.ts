import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
} from '@opentrons/shared-data'
import { makeContext, getInitialRobotStateStandard } from '../fixtures'
import { disengageMagnet } from '../commandCreators/atomic/disengageMagnet'
import { InvariantContext, RobotState } from '../types'
const moduleId = 'magneticModuleId'
const commandCreatorFnName = 'disengageMagnet'
describe('engageMagnet', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
    }
    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: '4',
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
    }
  })
  it('creates engage magnet command', () => {
    const module = moduleId
    const result = disengageMagnet(
      {
        commandCreatorFnName,
        module,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          command: 'magneticModule/disengageMagnet',
          params: {
            module,
          },
        },
      ],
    })
  })
})
