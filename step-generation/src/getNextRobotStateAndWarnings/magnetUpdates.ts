import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { resolveStringRuntimeValue } from '../utils'

import type {
  EngageMagnetStepGenArgs,
  InvariantContext,
  ModuleStepGenArgs,
  ModuleTemporalProperties,
  RobotStateAndWarnings,
} from '../types'

function _setMagnet(
  moduleState: ModuleTemporalProperties['moduleState'],
  engaged: boolean
): void {
  if (moduleState.type === MAGNETIC_MODULE_TYPE) {
    moduleState.engaged = engaged
  }
}

export function forEngageMagnet(
  params: EngageMagnetStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forEngageMagnet: arg resolved to null (moduleId=${String(moduleId)})`
    )
    return
  }
  const moduleState = getModuleState(robotState, moduleId)

  _setMagnet(moduleState, true)
}
export function forDisengageMagnet(
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forDisengageMagnet: arg resolved to null (moduleId=${String(moduleId)})`
    )
    return
  }
  const moduleState = getModuleState(robotState, moduleId)

  _setMagnet(moduleState, false)
}
