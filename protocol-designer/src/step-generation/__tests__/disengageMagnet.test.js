// @flow
import { makeContext, getInitialRobotStateStandard } from './fixtures'
import { disengageMagnet } from '../commandCreators/atomic/disengageMagnet'

const moduleId = 'magneticModuleId'
const commandCreatorFnName = 'disengageMagnet'

describe('engageMagnet', () => {
  let invariantContext
  let robotState

  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: 'magdeck',
      model: 'GEN1',
    }
    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: '4',
      moduleState: { type: 'magdeck', engaged: false },
    }
  })
  test('creates engage magnet command', () => {
    const module = moduleId
    const result = disengageMagnet(
      { commandCreatorFnName, module },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          command: 'magneticModule/disengageMagnet',
          params: { module },
        },
      ],
    })
  })
})
