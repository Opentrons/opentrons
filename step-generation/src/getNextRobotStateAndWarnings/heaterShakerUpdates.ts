import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { resolveNumericRuntimeValue, resolveStringRuntimeValue } from '../utils'

import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  HeaterShakerModuleState,
  HeaterShakerSetTargetShakeSpeedStepGenArgs,
  InvariantContext,
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
  const { robotState } = robotStateAndWarnings
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    return
  }
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = celsius
}

export const forHeaterShakerAwaitTemperature = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forHeaterShakerDeactivateHeater = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = null
}

export const forHeaterShakerSetTargetShakeSpeed = (
  params: HeaterShakerSetTargetShakeSpeedStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const rpm = resolveNumericRuntimeValue(params.rpm, runtimeParameters)
  if (moduleId == null || rpm == null) {
    return
  }
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetSpeed = rpm
}

export const forHeaterShakerStopShake = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetSpeed = null
}

export const forHeaterShakerOpenLatch = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.latchOpen = true
}

export const forHeaterShakerCloseLatch = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.latchOpen = false
}
