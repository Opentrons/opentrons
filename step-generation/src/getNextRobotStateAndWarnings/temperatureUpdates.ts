import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import { getModuleState } from '../robotStateSelectors'
import {
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_AT_TARGET,
} from '../constants'
import type {
  TemperatureParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
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
  const { moduleId, temperature } = params
  const moduleState = getModuleState(robotState, moduleId)

  _setTemperatureAndStatus(
    moduleState,
    temperature,
    TEMPERATURE_APPROACHING_TARGET
  )
}
export function forAwaitTemperature(
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const { moduleId, temperature } = params
  const moduleState = getModuleState(robotState, moduleId)

  if (moduleState.type === TEMPERATURE_MODULE_TYPE) {
    if (temperature === moduleState.targetTemperature) {
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
