import { isConcurrentGroup } from './stepHierarchy'

import type { StepIdType } from '/protocol-designer/form-types'
import type { StandaloneStep, StepHierarchy } from './stepHierarchy'

interface StepVisibilities {
  [key: StepIdType]: {
    isVisibleToUser: boolean
  }
}

/**
 * Certain steps exist internally in state but are never shown to the user;
 * they're managed implicitly by the system. e.g. Thermocycler and Vacuum profile
 * steps are permanently paired with implicit "wait for profile" pause steps, and
 * timed Vacuum state steps with implicit "wait for vacuum state" pause steps.
 *
 * This returns which steps are visible and which ones are invisible.
 *
 * This needs to stay in sync with what our React code actually renders.
 */
export function getStepVisibilities(
  stepHierarchy: StepHierarchy
): StepVisibilities {
  return Object.fromEntries([...yieldStepVisibilities(stepHierarchy)])
}

/** Thermocycler profile, vacuum profile, and timed vacuum-state groups share visibility rules. */
function* yieldVisibilitiesForProfileLikeGroup(group: {
  startStepId: StepIdType
  waitStepId: StepIdType
  concurrentSteps: StandaloneStep[]
}): Generator<[StepIdType, StepVisibilities[StepIdType]]> {
  yield [group.startStepId, { isVisibleToUser: true }]
  for (const concurrentStep of group.concurrentSteps) {
    concurrentStep.type satisfies 'standaloneStep'
    yield [concurrentStep.stepId, { isVisibleToUser: true }]
  }
  yield [group.waitStepId, { isVisibleToUser: false }]
}

function* yieldStepVisibilities(
  stepHierarchy: StepHierarchy
): Generator<[StepIdType, StepVisibilities[StepIdType]]> {
  for (const topLevelItem of stepHierarchy.topLevelItems) {
    if (topLevelItem.type === 'standaloneStep') {
      yield [topLevelItem.stepId, { isVisibleToUser: true }]
    } else if (isConcurrentGroup(topLevelItem)) {
      yield* yieldVisibilitiesForProfileLikeGroup({
        startStepId: topLevelItem.startStepId,
        waitStepId: topLevelItem.waitStepId,
        concurrentSteps: topLevelItem.concurrentSteps,
      })
    } else {
      topLevelItem satisfies never
    }
  }
}
