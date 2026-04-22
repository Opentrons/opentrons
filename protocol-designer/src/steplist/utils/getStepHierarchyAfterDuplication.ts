import { produce } from 'immer'

import type { StepIdType } from '/protocol-designer/form-types'
import type {
  ProfileConcurrentGroup,
  StandaloneStep,
  StepHierarchy,
  ThermocyclerProfileGroup,
  VacuumProfileGroup,
  VacuumStateDurationGroup,
} from './stepHierarchy'

/**
 * Computes how a `StepHierarchy` should change when some steps inside it are duplicated.
 *
 * - The new steps are inserted as a single contiguous sequence.
 * - The duplicated steps' relative order to each other is preserved.
 * - The new steps are inserted at some point after `stepIdToInsertAfter`.
 *   - Ideally, they will be inserted DIRECTLY after `stepIdToInsertAfter`.
 *     However, we'll compromise on that if it would do something invalid,
 *     like put a concurrent profile group inside another concurrent profile group.
 */
export function getStepHierarchyAfterDuplication(
  originalStepHierarchy: StepHierarchy,
  originalIdsToDuplicateIds: Record<StepIdType, StepIdType | undefined>,
  stepIdToInsertAfter: StepIdType
): StepHierarchy {
  return produce(originalStepHierarchy, draftStepHierarchy => {
    const insertionPoints = findInsertionPoints(
      draftStepHierarchy,
      stepIdToInsertAfter
    )

    if (insertionPoints == null) {
      console.error(
        "Couldn't find where to insert duplicated steps. " +
          'This is a bug in getStepHierarchyAfterDuplication() or its caller.'
      )
      return
    }

    const newSteps = getNewSteps(draftStepHierarchy, originalIdsToDuplicateIds)

    const { insertionPointInsideGroup, insertionPointOutsideGroup } =
      insertionPoints

    if (everyStepIsStandalone(newSteps)) {
      const insertionPoint =
        insertionPointInsideGroup ?? insertionPointOutsideGroup
      insertionPoint.parentArray.splice(
        insertionPoint.insertionIndex,
        0,
        ...newSteps
      )
    } else {
      const insertionPoint = insertionPointOutsideGroup
      insertionPoint.parentArray.splice(
        insertionPoint.insertionIndex,
        0,
        ...newSteps
      )
    }
  })
}

/**
 * Get the new, duplicated steps that we should insert.
 *
 * These have the same structure as the steps they're being duplicated from,
 * but with new IDs.
 */
function getNewSteps(
  stepHierarchy: StepHierarchy,
  originalIdsToDuplicateIds: Record<StepIdType, StepIdType | undefined>
): Array<StandaloneStep | ProfileConcurrentGroup> {
  const reduceStandaloneSteps = <T>(
    acc: T[],
    next: StandaloneStep
  ): Array<T | StandaloneStep> => {
    const newId = originalIdsToDuplicateIds[next.stepId]
    return newId != null
      ? [
          ...acc,
          {
            type: 'standaloneStep',
            stepId: newId,
          },
        ]
      : acc
  }

  const reduceGroupsAndStandaloneSteps = (
    acc: Array<StandaloneStep | ProfileConcurrentGroup>,
    next: StandaloneStep | ProfileConcurrentGroup
  ): Array<StandaloneStep | ProfileConcurrentGroup> => {
    if (next.type === 'standaloneStep') {
      return reduceStandaloneSteps(acc, next)
    } else if (next.type === 'thermocyclerProfileGroup') {
      const newProfileStepId =
        originalIdsToDuplicateIds[next.thermocyclerProfileStepId]
      const newWaitForProfileStepId =
        originalIdsToDuplicateIds[next.waitForThermocyclerProfileStepId]
      if (newProfileStepId != null && newWaitForProfileStepId != null) {
        // Duplicating the group itself, and possibly also some of the steps inside of it.
        const newGroup: ThermocyclerProfileGroup = {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: newProfileStepId,
          waitForThermocyclerProfileStepId: newWaitForProfileStepId,
          // When duplicating a group, the new group should only contain steps
          // that were themselves duplicated.
          concurrentSteps: next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        }
        return [...acc, newGroup]
      } else {
        // Not duplicating the group itself, but possibly duplicating some of the steps inside of it.
        return [
          ...acc,
          ...next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        ]
      }
    } else if (next.type === 'vacuumProfileGroup') {
      const newProfileStepId =
        originalIdsToDuplicateIds[next.vacuumProfileStepId]
      const newWaitForProfileStepId =
        originalIdsToDuplicateIds[next.waitForVacuumProfileStepId]
      if (newProfileStepId != null && newWaitForProfileStepId != null) {
        const newGroup: VacuumProfileGroup = {
          type: 'vacuumProfileGroup',
          vacuumProfileStepId: newProfileStepId,
          waitForVacuumProfileStepId: newWaitForProfileStepId,
          concurrentSteps: next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        }
        return [...acc, newGroup]
      } else {
        return [
          ...acc,
          ...next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        ]
      }
    } else {
      next.type satisfies 'vacuumStateDurationGroup'
      const newStateStepId = originalIdsToDuplicateIds[next.vacuumStateStepId]
      const newWaitForStateStepId =
        originalIdsToDuplicateIds[next.waitForVacuumStateStepId]
      if (newStateStepId != null && newWaitForStateStepId != null) {
        const newGroup: VacuumStateDurationGroup = {
          type: 'vacuumStateDurationGroup',
          vacuumStateStepId: newStateStepId,
          waitForVacuumStateStepId: newWaitForStateStepId,
          concurrentSteps: next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        }
        return [...acc, newGroup]
      } else {
        return [
          ...acc,
          ...next.concurrentSteps.reduce<StandaloneStep[]>(
            reduceStandaloneSteps,
            []
          ),
        ]
      }
    }
  }

  return stepHierarchy.topLevelItems.reduce(reduceGroupsAndStandaloneSteps, [])
}

function everyStepIsStandalone(
  steps: Array<StandaloneStep | ProfileConcurrentGroup>
): steps is StandaloneStep[] {
  return steps.every(({ type }) => type === 'standaloneStep')
}

/**
 * Figure out where the new steps should be inserted.
 *
 * Because different steps have different restrictions about where they can be inserted,
 * we return multiple candidates:
 *
 * 1. An insertion point outside of any group. Any step can be inserted here.
 * 2. Possibly, an insertion point inside a group. This is a better user experience
 *    (if the user duplicates a step that's inside a concurrent profile group, they'd expect the
 *    new step to be placed inside the profile, too), but not every step can be inserted here.
 *
 * The caller can then pick which one to use depending on what kind of steps it's inserting.
 */
function findInsertionPoints(
  originalStepHierarchy: StepHierarchy,
  stepIdToInsertAfter: StepIdType
): InsertionPoints | null {
  for (
    let topLevelItemIndex = 0;
    topLevelItemIndex < originalStepHierarchy.topLevelItems.length;
    topLevelItemIndex++
  ) {
    const topLevelItem = originalStepHierarchy.topLevelItems[topLevelItemIndex]
    if (topLevelItem.type === 'standaloneStep') {
      if (topLevelItem.stepId === stepIdToInsertAfter) {
        // Inserting after a top-level step.
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
        }
      }
    } else if (topLevelItem.type === 'thermocyclerProfileGroup') {
      if (topLevelItem.thermocyclerProfileStepId === stepIdToInsertAfter) {
        // Trying to insert after a step that's the beginning of a group.
        // Ideally, insert to become the first element inside that group;
        // but in case that wouldn't be valid, also allow inserting after the whole group.
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
          insertionPointInsideGroup: {
            parentArray: topLevelItem.concurrentSteps,
            insertionIndex: 0,
          },
        }
      } else if (
        topLevelItem.waitForThermocyclerProfileStepId === stepIdToInsertAfter
      ) {
        // Trying to insert after a step that's the end of a group.
        // So, insert after the whole group.
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
        }
      } else {
        for (
          let innerIndex = 0;
          innerIndex < topLevelItem.concurrentSteps.length;
          innerIndex++
        ) {
          const innerItem = topLevelItem.concurrentSteps[innerIndex]
          if (innerItem.stepId === stepIdToInsertAfter) {
            // Trying to insert after a step that's inside a group.
            // Ideally, insert directly after that step (still inside the group);
            // but in case that wouldn't be valid, also allow inserting after the whole group.
            return {
              insertionPointOutsideGroup: {
                parentArray: originalStepHierarchy.topLevelItems,
                insertionIndex: topLevelItemIndex + 1,
              },
              insertionPointInsideGroup: {
                parentArray: topLevelItem.concurrentSteps,
                insertionIndex: innerIndex + 1,
              },
            }
          }
        }
      }
    } else if (topLevelItem.type === 'vacuumProfileGroup') {
      if (topLevelItem.vacuumProfileStepId === stepIdToInsertAfter) {
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
          insertionPointInsideGroup: {
            parentArray: topLevelItem.concurrentSteps,
            insertionIndex: 0,
          },
        }
      } else if (
        topLevelItem.waitForVacuumProfileStepId === stepIdToInsertAfter
      ) {
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
        }
      } else {
        for (
          let innerIndex = 0;
          innerIndex < topLevelItem.concurrentSteps.length;
          innerIndex++
        ) {
          const innerItem = topLevelItem.concurrentSteps[innerIndex]
          if (innerItem.stepId === stepIdToInsertAfter) {
            return {
              insertionPointOutsideGroup: {
                parentArray: originalStepHierarchy.topLevelItems,
                insertionIndex: topLevelItemIndex + 1,
              },
              insertionPointInsideGroup: {
                parentArray: topLevelItem.concurrentSteps,
                insertionIndex: innerIndex + 1,
              },
            }
          }
        }
      }
    } else if (topLevelItem.type === 'vacuumStateDurationGroup') {
      if (topLevelItem.vacuumStateStepId === stepIdToInsertAfter) {
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
          insertionPointInsideGroup: {
            parentArray: topLevelItem.concurrentSteps,
            insertionIndex: 0,
          },
        }
      } else if (
        topLevelItem.waitForVacuumStateStepId === stepIdToInsertAfter
      ) {
        return {
          insertionPointOutsideGroup: {
            parentArray: originalStepHierarchy.topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
        }
      } else {
        for (
          let innerIndex = 0;
          innerIndex < topLevelItem.concurrentSteps.length;
          innerIndex++
        ) {
          const innerItem = topLevelItem.concurrentSteps[innerIndex]
          if (innerItem.stepId === stepIdToInsertAfter) {
            return {
              insertionPointOutsideGroup: {
                parentArray: originalStepHierarchy.topLevelItems,
                insertionIndex: topLevelItemIndex + 1,
              },
              insertionPointInsideGroup: {
                parentArray: topLevelItem.concurrentSteps,
                insertionIndex: innerIndex + 1,
              },
            }
          }
        }
      }
    } else {
      topLevelItem satisfies never
    }
  }
  return null
}

interface InsertionPoints {
  insertionPointInsideGroup?: {
    parentArray: StandaloneStep[]
    insertionIndex: number
  }
  insertionPointOutsideGroup: {
    parentArray: Array<StandaloneStep | ProfileConcurrentGroup>
    insertionIndex: number
  }
}
