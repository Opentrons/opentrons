import last from 'lodash/last'

import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'

import type { TCExtendedProfileParams } from '@opentrons/shared-data/command'
import type {
  ModuleOnlyParams,
  TCProfileParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
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
  const { moduleId, celsius } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.blockTargetTemp = celsius
}

export const forThermocyclerSetTargetLidTemperature = (
  params: TemperatureParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, celsius } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidTargetTemp = celsius
}

// todo(mm, 2025-12-09): This refers to a command from legacy JSON protocols, predating Protocol Engine.
// Does step-generation actually need to support this, or can we delete it?
export const forThermocyclerAwaitBlockTemperature = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

// todo(mm, 2025-12-09): This refers to a command from legacy JSON protocols, predating Protocol Engine.
// Does step-generation actually need to support this, or can we delete it?
export const forThermocyclerAwaitLidTemperature = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

// todo(mm, 2025-12-09): This refers to a command from legacy JSON protocols, predating Protocol Engine.
// Does step-generation actually need to support this, or can we delete it?
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
  // runProfile is equivalent to runExtendedProfile, just a different param shape.
  const { profile, ...rest } = params
  forThermocyclerRunExtendedProfile(
    {
      profileElements: profile,
      ...rest,
    },
    invariantContext,
    robotStateAndWarnings
  )
}

export const forThermocyclerRunExtendedProfile = (
  params: TCExtendedProfileParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, profileElements } = params
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  const flatSteps = profileElements.flatMap(element =>
    'steps' in element ? element.steps : element
  )
  const lastStep = last(flatSteps)
  if (lastStep != null) {
    moduleState.blockTargetTemp = lastStep.celsius
  }
}
