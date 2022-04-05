import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import { getModuleState } from '../robotStateSelectors'
import {
  TemperatureParams,
  ShakeSpeedParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import {
  HeaterShakerModuleState,
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
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
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, temperature } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = temperature
}

export const forHeaterShakerAwaitTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forHeaterShakerDeactivateHeater = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetTemp = null
}

export const forHeaterShakerSetTargetShakeSpeed = (
  params: ShakeSpeedParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, rpm } = params
  const moduleState = _getHeaterShakerModuleState(robotState, moduleId)

  moduleState.targetSpeed = rpm
}

export const forHeaterShakerStopShake = (
  params: ShakeSpeedParams,
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
