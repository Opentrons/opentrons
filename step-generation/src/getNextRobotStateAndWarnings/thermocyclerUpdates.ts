import last from 'lodash/last'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { getModuleState } from '../robotStateSelectors'
import type {
  ModuleOnlyParams,
  TCProfileParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  InvariantContext,
  RobotStateAndWarnings,
  RobotState,
  ThermocyclerModuleState,
} from '../types'

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
  params: ThermocyclerSetTargetBlockTemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, temperature } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.blockTargetTemp = temperature
}
export const forThermocyclerSetTargetLidTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, temperature } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

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
export const forThermocyclerAwaitProfileComplete = (
  params: ModuleOnlyParams,
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
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.blockTargetTemp = null
}
export const forThermocyclerDeactivateLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidTargetTemp = null
}
export const forThermocyclerCloseLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidOpen = false
}
export const forThermocyclerOpenLid = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidOpen = true
}
export const forThermocyclerRunProfile = (
  params: TCProfileParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, profile } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  if (profile.length > 0) {
    // @ts-expect-error (sa, 2021-05-03): last might return undefined
    moduleState.blockTargetTemp = last(profile).temperature
  }
}
