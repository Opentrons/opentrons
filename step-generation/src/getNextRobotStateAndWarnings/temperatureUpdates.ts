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
} from '@opentrons/shared-data/lib/protocol/types/schemaV4'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

// @ts-expect-error(SA, 2021-05-03): function parameters have implicit any types
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function _setTemperatureAndStatus(moduleState, temperature, status) {
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
  const { module, temperature } = params
  const moduleState = getModuleState(robotState, module)

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
  const { module, temperature } = params
  const moduleState = getModuleState(robotState, module)

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
  const { module } = params
  const moduleState = getModuleState(robotState, module)
  const temperature = null

  _setTemperatureAndStatus(moduleState, temperature, TEMPERATURE_DEACTIVATED)
}