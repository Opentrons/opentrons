// @flow
import last from 'lodash/last'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { getModuleState } from '../robotStateSelectors'
import type {
  ModuleOnlyParams,
  TCProfileParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureArgs,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotStateAndWarnings,
  RobotState,
} from '../types'
import type { ThermocyclerModuleState } from '../../step-forms/types'

const _getThermocyclerModuleState = (
  robotState: RobotState,
  module: string
): ThermocyclerModuleState => {
  const moduleState = getModuleState(robotState, module)
  if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
    return moduleState
  } else {
    console.error(
      `Thermocycler state updater expected ${module} moduleState to be thermocycler, but it was ${moduleState.type}`
    )
    // return some object instead of an error :/
    const fallback: any = {}
    return fallback
  }
}

export const forThermocyclerSetTargetBlockTemperature = (
  params: ThermocyclerSetTargetBlockTemperatureArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module, temperature } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.blockTargetTemp = temperature
}

export const forThermocyclerSetTargetLidTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module, temperature } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.lidTargetTemp = temperature
}

export const forThermocyclerAwaitBlockTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forThermocyclerAwaitLidTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forThermocyclerDeactivateBlock = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.blockTargetTemp = null
}

export const forThermocyclerDeactivateLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.lidTargetTemp = null
}

export const forThermocyclerCloseLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.lidOpen = false
}

export const forThermocyclerOpenLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)
  moduleState.lidOpen = true
}

export const forThermocyclerRunProfile = (
  params: TCProfileParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { module, profile } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, module)

  moduleState.blockTargetTemp = last(profile).temperature
}
