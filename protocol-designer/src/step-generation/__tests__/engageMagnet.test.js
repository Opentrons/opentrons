// @flow
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import { makeContext, getInitialRobotStateStandard } from '../__fixtures__'
import { engageMagnet } from '../commandCreators/atomic/engageMagnet'

const moduleId = 'magneticModuleId'
const commandCreatorFnName = 'engageMagnet'

describe('engageMagnet', () => {
  let invariantContext
  let robotState

  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: MAGNETIC_MODULE_TYPE,
      model: 'someMagModel',
    }
    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: '4',
      moduleState: { type: MAGNETIC_MODULE_TYPE, engaged: false },
    }
  })
  test('creates engage magnet command', () => {
    const module = moduleId
    const engageHeight = 2
    const result = engageMagnet(
      { commandCreatorFnName, module, engageHeight },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          command: 'magneticModule/engageMagnet',
          params: { module, engageHeight },
        },
      ],
    })
  })
})
