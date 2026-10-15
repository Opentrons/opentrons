import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import {
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../constants'
import { getModuleState } from '../robotStateSelectors'
import { resolveNumericRuntimeValue, resolveStringRuntimeValue } from '../utils'

import type { TemperatureModuleAwaitTemperatureParams } from '@opentrons/shared-data'
import type {
  InvariantContext,
  ModuleStepGenArgs,
  ModuleTemporalProperties,
  RobotStateAndWarnings,
  SetTemperatureStepGenArgs,
  TemperatureStatus,
  WaitForTemperatureStepGenArgs,
} from '../types'

function _setTemperatureAndStatus(
  moduleState: ModuleTemporalProperties['moduleState'],
  temperature: number | null,
  status: TemperatureStatus
): void {
  if (moduleState.type === TEMPERATURE_MODULE_TYPE) {
    moduleState.targetTemperature = temperature
    moduleState.status = status
  }
}

export function forSetTemperature(
  params: SetTemperatureStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    console.error(
      `forSetTemperature: arg resolved to null (moduleId=${String(
        moduleId
      )}, celsius=${String(celsius)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, moduleId)

  _setTemperatureAndStatus(moduleState, celsius, TEMPERATURE_APPROACHING_TARGET)
}
export function forAwaitTemperature(
  params:
    WaitForTemperatureStepGenArgs | TemperatureModuleAwaitTemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  if (params.celsius == null) {
    return
  }
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    console.error(
      `forAwaitTemperature: arg resolved to null (moduleId=${String(
        moduleId
      )}, celsius=${String(celsius)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, moduleId)

  if (moduleState.type === TEMPERATURE_MODULE_TYPE) {
    if (celsius === moduleState.targetTemperature) {
      moduleState.status = TEMPERATURE_AT_TARGET
    }
  }
}
export function forDeactivateTemperature(
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    console.error(
      `forDeactivateTemperature: arg resolved to null (moduleId=${String(
        moduleId
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, moduleId)
  const temperature = null

  _setTemperatureAndStatus(moduleState, temperature, TEMPERATURE_DEACTIVATED)
}
