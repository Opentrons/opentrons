import type { StepIdType } from '/protocol-designer/form-types'
import type { StepHierarchy } from './stepHierarchy'

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
    } else if (topLevelItem.type === 'vacuumProfileGroup') {
      yield [topLevelItem.vacuumProfileStepId, { isVisibleToUser: true }]
      for (const concurrentStep of topLevelItem.concurrentSteps) {
        concurrentStep.type satisfies 'standaloneStep'
        yield [concurrentStep.stepId, { isVisibleToUser: true }]
      }
      yield [
        topLevelItem.waitForVacuumProfileStepId,
        { isVisibleToUser: false },
      ]
    } else if (topLevelItem.type === 'vacuumStateDurationGroup') {
      yield [topLevelItem.vacuumStateStepId, { isVisibleToUser: true }]
      for (const concurrentStep of topLevelItem.concurrentSteps) {
        concurrentStep.type satisfies 'standaloneStep'
        yield [concurrentStep.stepId, { isVisibleToUser: true }]
      }
      yield [topLevelItem.waitForVacuumStateStepId, { isVisibleToUser: false }]
    } else {
      topLevelItem satisfies never
    }
  }
}
