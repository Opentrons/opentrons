// @flow
import cloneDeep from 'lodash/cloneDeep'
import { makeContext, getInitialRobotStateStandard } from './fixtures'
import {
  forEngageMagnet,
  forDisengageMagnet,
} from '../getNextRobotStateAndWarnings/magnetUpdates'

const moduleId = 'magneticModuleId'
let invariantContext
let disengagedRobotState
let engagedRobotState

beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities[moduleId] = {
    id: moduleId,
    type: 'magdeck',
    model: 'GEN1',
  }
  disengagedRobotState = getInitialRobotStateStandard(invariantContext)
  disengagedRobotState.modules[moduleId] = {
    slot: '4',
    moduleState: { type: 'magdeck', engaged: false },
  }
  engagedRobotState = cloneDeep(disengagedRobotState)
  engagedRobotState.modules[moduleId].moduleState = {
    type: 'magdeck',
    engaged: true,
  }
})

describe('forEngageMagnet', () => {
  test('engages magnetic module when it was unengaged', () => {
    const result = forEngageMagnet(
      { module: moduleId, engageHeight: 10 },
      invariantContext,
      disengagedRobotState
    )
    expect(result).toEqual({ warnings: [], robotState: engagedRobotState })
  })

  test('no effect on magnetic module "engaged" state when already engaged', () => {
    const result = forEngageMagnet(
      { module: moduleId, engageHeight: 11 },
      invariantContext,
      engagedRobotState
    )
    expect(result).toEqual({ warnings: [], robotState: engagedRobotState })
  })
})

describe('forDisengageMagnet', () => {
  test('unengages magnetic module when it was engaged', () => {
    const result = forDisengageMagnet(
      { module: moduleId },
      invariantContext,
      engagedRobotState
    )
    expect(result).toEqual({ warnings: [], robotState: disengagedRobotState })
  })

  test('no effect on magnetic module "engaged" state when already disengaged', () => {
    const result = forDisengageMagnet(
      { module: moduleId },
      invariantContext,
      disengagedRobotState
    )
    expect(result).toEqual({ warnings: [], robotState: disengagedRobotState })
  })
})
