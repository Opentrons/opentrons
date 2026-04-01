import type { StepIdType } from '/protocol-designer/form-types'
import type { StepHierarchy } from './stepHierarchy'

interface StepVisibilities {
  [key: StepIdType]: {
    isVisibleToUser: boolean
  }
}

/**
 * Certain steps exist internally in state but are never shown to the user;
 * they're managed implicitly by the system. e.g. Thermocycler profile steps are
 * permanently paired with implicit "wait for profile" steps.
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

function* yieldStepVisibilities(
  stepHierarchy: StepHierarchy
): Generator<[StepIdType, StepVisibilities[StepIdType]]> {
  for (const topLevelItem of stepHierarchy.topLevelItems) {
    if (topLevelItem.type === 'standaloneStep') {
      yield [topLevelItem.stepId, { isVisibleToUser: true }]
    } else if (topLevelItem.type === 'thermocyclerProfileGroup') {
      yield [topLevelItem.thermocyclerProfileStepId, { isVisibleToUser: true }]
      for (const concurrentStep of topLevelItem.concurrentSteps) {
        concurrentStep.type satisfies 'standaloneStep'
        yield [concurrentStep.stepId, { isVisibleToUser: true }]
      }
      yield [
        topLevelItem.waitForThermocyclerProfileStepId,
        { isVisibleToUser: false },
      ]
    } else {
      topLevelItem satisfies never
    }
  }
}
