import { produce } from 'immer'

import { isConcurrentGroup } from './stepHierarchy'

import type { StepIdType } from '/protocol-designer/form-types'
import type {
  ConcurrentGroup,
  StandaloneStep,
  StepHierarchy,
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

interface ProfileLikeGroupIds {
  startStepId: StepIdType
  waitStepId: StepIdType
  concurrentSteps: StandaloneStep[]
}

type ProfileLikeConcurrentGroupKind = ConcurrentGroup['type']

function buildDuplicatedProfileLikeGroup(
  groupKind: ProfileLikeConcurrentGroupKind,
  newStart: StepIdType,
  newWait: StepIdType,
  concurrentSteps: StandaloneStep[]
): ConcurrentGroup {
  return {
    type: groupKind,
    startStepId: newStart,
    waitStepId: newWait,
    concurrentSteps,
  }
}

/**
 * Thermocycler profile, vacuum profile, and timed vacuum-state groups share duplication rules:
 * if both the root step and the paired wait are duplicated, emit a new group whose concurrent
 * list only includes steps that were duplicated; otherwise flatten any duplicated concurrent steps.
 */
function reduceDuplicateOfProfileLikeGroup(
  acc: Array<StandaloneStep | ConcurrentGroup>,
  group: ProfileLikeGroupIds,
  idMap: Record<StepIdType, StepIdType | undefined>,
  duplicateConcurrentSteps: (steps: StandaloneStep[]) => StandaloneStep[],
  groupKind: ProfileLikeConcurrentGroupKind
): Array<StandaloneStep | ConcurrentGroup> {
  const newStart = idMap[group.startStepId]
  const newWait = idMap[group.waitStepId]
  const concurrentDuplicated = duplicateConcurrentSteps(group.concurrentSteps)
  if (newStart != null && newWait != null) {
    return [
      ...acc,
      buildDuplicatedProfileLikeGroup(
        groupKind,
        newStart,
        newWait,
        concurrentDuplicated
      ),
    ]
  }
  return [...acc, ...concurrentDuplicated]
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
): Array<StandaloneStep | ConcurrentGroup> {
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

  const duplicateConcurrentSteps = (
    steps: StandaloneStep[]
  ): StandaloneStep[] =>
    steps.reduce<StandaloneStep[]>(reduceStandaloneSteps, [])

  const reduceGroupsAndStandaloneSteps = (
    acc: Array<StandaloneStep | ConcurrentGroup>,
    next: StandaloneStep | ConcurrentGroup
  ): Array<StandaloneStep | ConcurrentGroup> => {
    if (next.type === 'standaloneStep') {
      return reduceStandaloneSteps(acc, next)
    }
    if (isConcurrentGroup(next)) {
      return reduceDuplicateOfProfileLikeGroup(
        acc,
        {
          startStepId: next.startStepId,
          waitStepId: next.waitStepId,
          concurrentSteps: next.concurrentSteps,
        },
        originalIdsToDuplicateIds,
        duplicateConcurrentSteps,
        next.type
      )
    }
    throw new Error(
      'getNewSteps: unexpected top-level step hierarchy item (not standalone or concurrent group)'
    )
  }

  return stepHierarchy.topLevelItems.reduce(reduceGroupsAndStandaloneSteps, [])
}

function everyStepIsStandalone(
  steps: Array<StandaloneStep | ConcurrentGroup>
): steps is StandaloneStep[] {
  return steps.every(({ type }) => type === 'standaloneStep')
}

interface InsertionPoints {
  insertionPointInsideGroup?: {
    parentArray: StandaloneStep[]
    insertionIndex: number
  }
  insertionPointOutsideGroup: {
    parentArray: Array<StandaloneStep | ConcurrentGroup>
    insertionIndex: number
  }
}

/**
 * Thermocycler profile, vacuum profile, and timed vacuum-state groups all share the same
 * shape: a root step, concurrent steps, and a hidden wait step. Duplication insertion uses
 * the same rules for each.
 *
 * @returns insertion points when `stepIdToInsertAfter` belongs to this group; `undefined`
 *   when it does not (caller should keep scanning top-level items).
 */
function tryInsertionPointsForConcurrentGroup(
  topLevelItems: StepHierarchy['topLevelItems'],
  topLevelItemIndex: number,
  stepIdToInsertAfter: StepIdType,
  group: {
    startStepId: StepIdType
    waitStepId: StepIdType
    concurrentSteps: StandaloneStep[]
  }
): InsertionPoints | undefined {
  const insertionPointOutsideGroup = {
    parentArray: topLevelItems,
    insertionIndex: topLevelItemIndex + 1,
  }

  if (group.startStepId === stepIdToInsertAfter) {
    // After the step that opens the group: prefer first slot inside the group, with a
    // fallback of inserting after the whole group.
    return {
      insertionPointOutsideGroup,
      insertionPointInsideGroup: {
        parentArray: group.concurrentSteps,
        insertionIndex: 0,
      },
    }
  }
  if (group.waitStepId === stepIdToInsertAfter) {
    // After the hidden wait that closes the group: only after the whole group.
    return { insertionPointOutsideGroup }
  }
  for (let i = 0; i < group.concurrentSteps.length; i++) {
    if (group.concurrentSteps[i].stepId === stepIdToInsertAfter) {
      // After a concurrent step: prefer still inside the group, with fallback after the group.
      return {
        insertionPointOutsideGroup,
        insertionPointInsideGroup: {
          parentArray: group.concurrentSteps,
          insertionIndex: i + 1,
        },
      }
    }
  }
  return undefined
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
  const { topLevelItems } = originalStepHierarchy
  for (
    let topLevelItemIndex = 0;
    topLevelItemIndex < topLevelItems.length;
    topLevelItemIndex++
  ) {
    const topLevelItem = topLevelItems[topLevelItemIndex]
    if (topLevelItem.type === 'standaloneStep') {
      if (topLevelItem.stepId === stepIdToInsertAfter) {
        // Inserting after a top-level step.
        return {
          insertionPointOutsideGroup: {
            parentArray: topLevelItems,
            insertionIndex: topLevelItemIndex + 1,
          },
        }
      }
    } else if (isConcurrentGroup(topLevelItem)) {
      const found = tryInsertionPointsForConcurrentGroup(
        topLevelItems,
        topLevelItemIndex,
        stepIdToInsertAfter,
        {
          startStepId: topLevelItem.startStepId,
          waitStepId: topLevelItem.waitStepId,
          concurrentSteps: topLevelItem.concurrentSteps,
        }
      )
      if (found != null) {
        return found
      }
    } else {
      topLevelItem satisfies never
    }
  }
  return null
}
