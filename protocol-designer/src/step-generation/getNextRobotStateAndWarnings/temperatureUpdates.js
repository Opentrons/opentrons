// @flow
import assert from 'assert'
import { getModuleState } from '../utils/misc'
import {
  TEMPDECK,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import type {
  TemperatureParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

function _setTemperatureAndStatus(moduleState, temperature, status) {
  if (moduleState.type === TEMPDECK) {
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

  assert(
    module in robotState.modules,
    `forSetTemperature expected module id "${module}"`
  )

  _setTemperatureAndStatus(
    moduleState,
    temperature,
    TEMPERATURE_APPROACHING_TARGET
  )
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

  assert(
    module in robotState.modules,
    `forDeactivateTemperature expected module id "${module}"`
  )

  _setTemperatureAndStatus(moduleState, temperature, TEMPERATURE_DEACTIVATED)
}
