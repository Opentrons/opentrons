import last from 'lodash/last'

import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  unrollThermocyclerProfile,
  uuid,
} from '../utils'
import { handleWaitForTaskForModules } from './forWaitForTasks'

import type {
  AtomicProfileStep,
  TCExtendedProfileParams,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  ModuleStepGenArgs,
  RobotState,
  RobotStateAndWarnings,
  SetTemperatureStepGenArgs,
  ThermocyclerModuleState,
} from '../types'

type RuntimeProfileStep = {
  celsius: number | string
  holdSeconds: number | string
}

type RuntimeProfileElement =
  | RuntimeProfileStep
  | {
      steps: RuntimeProfileStep[]
      repetitions: number | string
    }

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
  params: SetTemperatureStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.currentBlockActivity = {
    type: 'blockTargetTemp',
    blockTargetTemp: celsius,
  }
}

export const forThermocyclerSetTargetLidTemperature = (
  params: SetTemperatureStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(params.celsius, runtimeParameters)
  if (moduleId == null || celsius == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidTargetTemp = celsius
}

export const forThermocyclerAwaitBlockTemperature = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forThermocyclerAwaitLidTemperature = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

// todo(mm, 2025-12-09): This refers to a command from legacy JSON protocols, predating Protocol Engine.
// Does step-generation actually need to support this, or can we delete it?
export const forThermocyclerAwaitProfileComplete = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // nothing to be done
}

export const forThermocyclerDeactivateBlock = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.currentBlockActivity = {
    type: 'blockDeactivated',
  }
}

export const forThermocyclerDeactivateLid = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidTargetTemp = null
}

export const forThermocyclerCloseLid = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidOpen = false
}

export const forThermocyclerOpenLid = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.lidOpen = true
}

function resolveProfileStep(
  step: RuntimeProfileStep,
  runtimeParameters: InvariantContext['runtimeParameters']
): AtomicProfileStep | null {
  const celsius = resolveNumericRuntimeValue(step.celsius, runtimeParameters)
  const holdSeconds = resolveNumericRuntimeValue(
    step.holdSeconds,
    runtimeParameters
  )
  if (celsius == null || holdSeconds == null) {
    return null
  }
  return { celsius, holdSeconds }
}

function resolveProfileElements(
  profileElements: RuntimeProfileElement[],
  runtimeParameters: InvariantContext['runtimeParameters']
): TCExtendedProfileParams['profileElements'] | null {
  const resolved: TCExtendedProfileParams['profileElements'] = []
  for (const element of profileElements) {
    if ('steps' in element) {
      const repetitions = resolveNumericRuntimeValue(
        element.repetitions,
        runtimeParameters
      )
      if (repetitions == null) {
        return null
      }
      const steps: AtomicProfileStep[] = []
      for (const step of element.steps) {
        const resolvedStep = resolveProfileStep(step, runtimeParameters)
        if (resolvedStep == null) {
          return null
        }
        steps.push(resolvedStep)
      }
      resolved.push({ steps, repetitions })
    } else {
      const resolvedStep = resolveProfileStep(element, runtimeParameters)
      if (resolvedStep == null) {
        return null
      }
      resolved.push(resolvedStep)
    }
  }
  return resolved
}

export const forThermocyclerRunProfile = (
  params: ModuleStepGenArgs & {
    profile: RuntimeProfileStep[]
    blockMaxVolumeUl?: number | string
  },
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
  params: ModuleStepGenArgs & {
    profileElements: RuntimeProfileElement[]
    blockMaxVolumeUl?: number | string
  },
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  // A (blocking) runExtendedProfile command is equivalent to a (nonblocking)
  // startRunExtendedProfile command immediately followed by a waitForTasks command.
  // So, pretend that's exactly what happened--start and then immediately await a fake
  // task.
  //
  // Because all of this happens within the scope of this function, the task ID is
  // arbitrary. Nothing outside this function should see or care about it. We add a
  // UUID to keep it unique just in case something goes wrong and it does leak out of
  // this function somehow.
  const privateTaskId = +'thermocyclerRunExtendedProfile-private-' + uuid()
  const started = forThermocyclerStartRunExtendedProfile(
    { ...params, taskId: privateTaskId },
    invariantContext,
    robotStateAndWarnings
  )
  if (!started) {
    return
  }

  // new shared entrypoint for module task updates (currently used by thermocyclers and vacuums, but extensible to other modules)
  handleWaitForTaskForModules(
    privateTaskId,
    robotStateAndWarnings,
    THERMOCYCLER_MODULE_TYPE
  )
}

export const forThermocyclerStartRunExtendedProfile = (
  params: ModuleStepGenArgs & {
    profileElements: RuntimeProfileElement[]
    blockMaxVolumeUl?: number | string
    taskId?: string | null
  },
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): boolean => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const profileElements = resolveProfileElements(
    params.profileElements,
    runtimeParameters
  )
  if (moduleId == null || profileElements == null) {
    return false
  }
  let taskId: string | null = null
  if (params.taskId != null) {
    const resolvedTaskId = resolveStringRuntimeValue(
      params.taskId,
      runtimeParameters
    )
    if (resolvedTaskId == null) {
      return false
    }
    taskId = resolvedTaskId
  }
  const { robotState } = robotStateAndWarnings

  const moduleState = _getThermocyclerModuleState(robotState, moduleId)

  moduleState.currentBlockActivity = {
    type: 'profile',
    profileElements,
    taskId,
  }
  moduleState.numProfilesStarted++
  return true
}

/**
 * Update Thermocycler state to account for the given task being awaited.
 *
 * This returns `true` if this task was found to be a Thermocycler-related task.
 * If it's not a Thermocycler-related task, this returns `false` and no-ops.
 */
export const handleWaitForTaskForThermocyclers = (
  thermocyclerModuleState: ThermocyclerModuleState
): boolean => {
  if (thermocyclerModuleState.currentBlockActivity.type === 'profile') {
    const lastBlockTemp = lastBlockTempFromProfile(
      thermocyclerModuleState.currentBlockActivity.profileElements
    )
    thermocyclerModuleState.currentBlockActivity =
      lastBlockTemp != null
        ? {
            type: 'blockTargetTemp',
            blockTargetTemp: lastBlockTemp,
          }
        : {
            type: 'blockDeactivated',
          }
    return true
  } else {
    return false
  }
}

function lastBlockTempFromProfile(
  profileElements: TCExtendedProfileParams['profileElements']
): number | null {
  const lastStep = last(unrollThermocyclerProfile(profileElements))
  return lastStep != null ? lastStep.celsius : null
}
