import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import { getModuleState } from '../robotStateSelectors'
import {
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_AT_TARGET,
} from '../constants'
import type {
  TemperatureModuleAwaitTemperatureParams,
  TemperatureParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/module'
import type {
  InvariantContext,
  RobotStateAndWarnings,
  ModuleTemporalProperties,
  TemperatureStatus,
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
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const { moduleId, celsius } = params
  const moduleState = getModuleState(robotState, moduleId)

  _setTemperatureAndStatus(moduleState, celsius, TEMPERATURE_APPROACHING_TARGET)
}
export function forAwaitTemperature(
  params: TemperatureModuleAwaitTemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const { moduleId, celsius } = params
  const moduleState = getModuleState(robotState, moduleId)

  if (moduleState.type === TEMPERATURE_MODULE_TYPE) {
    if (celsius === moduleState.targetTemperature) {
      moduleState.status = TEMPERATURE_AT_TARGET
    }
  }
}
export function forDeactivateTemperature(
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = getModuleState(robotState, moduleId)
  const temperature = null

  _setTemperatureAndStatus(moduleState, temperature, TEMPERATURE_DEACTIVATED)
}
