import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { resolveNumericRuntimeValue, resolveStringRuntimeValue } from '../utils'

import type {
  HeaterShakerModuleState,
  HeaterShakerSetTargetShakeSpeedStepGenArgs,
  InvariantContext,
  ModuleStepGenArgs,
  RobotState,
  RobotStateAndWarnings,
  SetTemperatureStepGenArgs,
} from '../types'

const _getHeaterShakerModuleState = (
  robotState: RobotState,
  module: string
): HeaterShakerModuleState => {
  const moduleState = getModuleState(robotState, module)

  if (moduleState.type === HEATERSHAKER_MODULE_TYPE) {
    return moduleState
  } else {
    console.error(
      `Heater-Shaker state updater expected ${module} moduleState to be heaterShaker, but it was ${moduleState.type}`
    )
    // return some object instead of an error :/
    const fallback: any = {}
    return fallback
  }
}

export const forHeaterShakerSetTargetTemperature = (
  params: SetTemperatureStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    console.error(
      `forHeaterShakerSetTargetTemperature: arg resolved to null (moduleId=${String(
        moduleId
      )}, celsius=${String(celsius)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = celsius
}

export const forHeaterShakerAwaitTemperature = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forHeaterShakerDeactivateHeater = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forHeaterShakerDeactivateHeater: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = null
}

export const forHeaterShakerSetTargetShakeSpeed = (
  params: HeaterShakerSetTargetShakeSpeedStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const rpm = resolveNumericRuntimeValue(params.rpm, runtimeParameters)
  if (moduleId == null || rpm == null) {
    console.error(
      `forHeaterShakerSetTargetShakeSpeed: arg resolved to null (moduleId=${String(
        moduleId
      )}, rpm=${String(rpm)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetSpeed = rpm
}

export const forHeaterShakerStopShake = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forHeaterShakerStopShake: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetSpeed = null
}

export const forHeaterShakerOpenLatch = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forHeaterShakerOpenLatch: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.latchOpen = true
}

export const forHeaterShakerCloseLatch = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forHeaterShakerCloseLatch: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.latchOpen = false
}
