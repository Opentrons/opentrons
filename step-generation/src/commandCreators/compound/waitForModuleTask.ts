import * as errorCreators from '../../errorCreators'
import {
  thermocyclerStateGetter,
  vacuumModuleStateGetter,
} from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { waitForTasks } from '../atomic/waitForTasks'

import type {
  CommandCreator,
  CurriedCommandCreator,
  WaitForModuleTaskArgs,
} from '../../types'

/**
 * Given a module that's had some concurrent task started on it,
 * emit a command that waits for that task to complete.
 */
export const waitForModuleTask: CommandCreator<WaitForModuleTaskArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { waitCondition } = args

  // For now, we only support this one wait condition.
  // Eventually, we'll probably need to support different kinds of module tasks here,
  // and this `satisfies` statement will need to become a `switch` or something.

  if (waitCondition === 'thermocyclerProfileComplete') {
    return waitForThermocyclerProfileComplete(
      args,
      invariantContext,
      prevRobotState
    )
  } else if (
    waitCondition === 'vacuumProfileComplete' ||
    waitCondition === 'vacuumStateComplete'
  ) {
    return waitForVacuumPumpActivityComplete(
      args,
      invariantContext,
      prevRobotState
    )
  }
  return {
    errors: [errorCreators.invalidWaitCondition(waitCondition)],
  }
}

const waitForThermocyclerProfileComplete: CommandCreator<
  WaitForModuleTaskArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleId } = args
  const commandCreators: CurriedCommandCreator[] = []

  const thermocyclerState = thermocyclerStateGetter(prevRobotState, moduleId)
  if (thermocyclerState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  if (thermocyclerState.currentBlockActivity.type !== 'profile') {
    return {
      errors: [errorCreators.missingProfileStep()],
    }
  }

  const { taskId } = thermocyclerState.currentBlockActivity
  if (taskId == null) {
    return {
      errors: [errorCreators.missingProfileStep()],
    }
  }

  commandCreators.push(
    curryCommandCreator(waitForTasks, { task_ids: [taskId] })
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}

const waitForVacuumPumpActivityComplete: CommandCreator<
  WaitForModuleTaskArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleId } = args
  const commandCreators: CurriedCommandCreator[] = []

  const vacuumState = vacuumModuleStateGetter(prevRobotState, moduleId)
  if (vacuumState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  if (
    vacuumState.currentPumpActivity.type !== 'timedHold' &&
    vacuumState.currentPumpActivity.type !== 'profile'
  ) {
    return {
      errors: [errorCreators.missingPumpActivity()],
    }
  }

  const taskId = vacuumState.currentPumpActivity.taskId

  commandCreators.push(
    curryCommandCreator(waitForTasks, { task_ids: [taskId] })
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
