// @flow
import assert from 'assert'
import type {
  EngageMagnetParams,
  DisengageMagnetParams,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

const _setMagnet = (
  robotState: RobotState,
  moduleId: string,
  engaged: boolean
): RobotState => ({
  ...robotState,
  modules: {
    ...robotState.modules,
    [moduleId]: {
      ...robotState.modules[moduleId],
      moduleState: {
        ...robotState.modules[moduleId].moduleState,
        engaged,
      },
    },
  },
})

export function forEngageMagnet(
  params: EngageMagnetParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { module } = params
  assert(
    module in prevRobotState.modules,
    `forEngageMagnet expected module id "${module}"`
  )
  return {
    warnings: [],
    robotState: _setMagnet(prevRobotState, module, true),
  }
}

export function forDisengageMagnet(
  params: DisengageMagnetParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { module } = params
  assert(
    module in prevRobotState.modules,
    `forDisengageMagnet expected module id "${module}"`
  )
  return {
    warnings: [],
    robotState: _setMagnet(prevRobotState, module, false),
  }
}
