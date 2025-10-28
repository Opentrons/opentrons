import { produce } from 'immer'

import { PAUSE_UNTIL_TC_PROFILE_COMPLETE } from '/protocol-designer/constants'

import type { FormData, StepIdType } from '/protocol-designer/form-types'

/**
 * A hierarchical view of timeline steps.
 *
 * For example, if the list of steps is:
 *
 * 1. Transfer A1->A2
 * 2. Start Thermocycler profile
 * 3. Transfer B1->B2
 * 4. Wait until Thermocycler profile is complete
 * 5. Transfer C1->C2
 *
 * Then the equivalent `StepHierarchy` is like:
 *
 * 1. Transfer A1->A2
 * 2. Start Thermocycler profile. And while it's running...
 *   2a. Transfer B1->B2
 * 3. Transfer C1->C2
 */
export interface StepHierarchy {
  topLevelItems: Array<StandaloneStep | ThermocyclerProfileGroup>
}

/** A normal, standalone step. */
export interface StandaloneStep {
  type: 'standaloneStep'
  stepId: StepIdType
}

/** A group of steps representing a Thermocycler profile and stuff happening concurrently to it. */
export interface ThermocyclerProfileGroup {
  type: 'thermocyclerProfileGroup'
  /** The step that starts the Thermocycler profile. */
  thermocyclerProfileStepId: StepIdType
  /** The steps that run while the Thermocycler profile is running. */
  concurrentSteps: StandaloneStep[]
  /**
   * The steps that waits for the Thermocycler profile to finish.
   * This is hidden in the UI.
   */
  waitForThermocyclerProfileStepId: StepIdType
}

/**
 * Given a flat array of steps, return the equivalent hierarchy.
 *
 * If enableConcurrentModuleActions is false, this is a no-op.
 */
export function convertStepArrayToHierarchy(
  steps: FormData[],
  enableConcurrentModuleActions: boolean
): StepHierarchy {
  if (enableConcurrentModuleActions) {
    return {
      topLevelItems: [
        ..._convertStepArrayToHierarchy(steps, enableConcurrentModuleActions),
      ],
    }
  } else {
    return {
      topLevelItems: steps.map(step => ({
        type: 'standaloneStep',
        stepId: step.id,
      })),
    }
  }
}

function* _convertStepArrayToHierarchy(
  steps: FormData[],
  enableConcurrentModuleActions: boolean
): Generator<StandaloneStep | ThermocyclerProfileGroup> {
  let currentGroup: {
    thermocyclerProfileStepId: StepIdType
    concurrentStepIds: StepIdType[]
  } | null = null

  for (const step of steps) {
    if (
      step.stepType === 'thermocycler' &&
      step.thermocyclerFormType === 'thermocyclerProfile'
    ) {
      // Open a new group.
      if (currentGroup != null) {
        console.error(
          'More than 1 level of step groups trying to nest within each other. This should not be able to happen.'
        )
      }
      currentGroup = {
        thermocyclerProfileStepId: step.id,
        concurrentStepIds: [],
      }
    } else if (
      step.stepType === 'pause' &&
      step.pauseAction === PAUSE_UNTIL_TC_PROFILE_COMPLETE
    ) {
      // Close an existing group.
      if (currentGroup == null) {
        console.error(
          'A step is trying to close a group, but there is no group to close. This should not be able to happen.'
        )
      } else {
        yield {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: currentGroup.thermocyclerProfileStepId,
          concurrentSteps: currentGroup.concurrentStepIds.map(stepId => ({
            type: 'standaloneStep',
            stepId,
          })),
          waitForThermocyclerProfileStepId: step.id,
        }
        currentGroup = null
      }
    } else {
      if (currentGroup == null) {
        yield {
          type: 'standaloneStep',
          stepId: step.id,
        }
      } else {
        currentGroup.concurrentStepIds.push(step.id)
      }
    }
  }
}

/** Given a step hierarchy, turn it back into the equivalent flat array of steps. */
export function convertStepHierarchyToArray(
  stepHierarchy: StepHierarchy
): StepIdType[] {
  const getStepIdsContainedInTopLevelItem = (
    topLevelItem: StandaloneStep | ThermocyclerProfileGroup
  ): StepIdType[] => {
    switch (topLevelItem.type) {
      case 'standaloneStep':
        return [topLevelItem.stepId]
      case 'thermocyclerProfileGroup':
        return [
          topLevelItem.thermocyclerProfileStepId,
          ...topLevelItem.concurrentSteps.map(step => step.stepId),
          topLevelItem.waitForThermocyclerProfileStepId,
        ]
    }
  }
  return stepHierarchy.topLevelItems.flatMap(getStepIdsContainedInTopLevelItem)
}

type MoveStepParams =
  | {
      moveType: 'insertBeforeDestinationStep'
      /**
       * If this points to the root step of a concurrent group, the whole concurrent
       * group will be moved as an atomic unit. Otherwise, just the single step that's
       * pointed to will be moved.
       */
      movedStepId: StepIdType
      destinationStepId: StepIdType
    }
  | {
      moveType: 'insertAsLastStepOfGroup'
      movedStepId: StepIdType
      destinationGroupRootStepId: StepIdType
    }

type MoveStepResult =
  | {
      isMoveAllowed: true
      /**
       * What the full step ordering will be, after this movement has been applied.
       * The prior step ordering, in application state, should be replaced with this.
       */
      stepsAfterMove: StepHierarchy
    }
  | { isMoveAllowed: false }

/**
 * Recursively search the tree for a given step ID. It can either point to a
 * standalone step, or to the root of a group.
 *
 * The match's location in the tree is returned: either the top-level `StepHierarchy`,
 * if the match was found at the top level, or the `ThermocyclerProfileGroup`, if the
 * match was found inside that group.
 *
 * Returns `null` if there's no match.
 */
function findStep(
  stepHierarchy: StepHierarchy,
  stepIdToFind: StepIdType
): null | {
  enclosingNode: StepHierarchy | ThermocyclerProfileGroup
  indexInEnclosingNode: number
} {
  const { topLevelItems } = stepHierarchy
  for (
    let topLevelIndex = 0;
    topLevelIndex < topLevelItems.length;
    topLevelIndex++
  ) {
    const topLevelItem = topLevelItems[topLevelIndex]
    if (
      (topLevelItem.type === 'standaloneStep' &&
        topLevelItem.stepId === stepIdToFind) ||
      (topLevelItem.type === 'thermocyclerProfileGroup' &&
        topLevelItem.thermocyclerProfileStepId === stepIdToFind)
    ) {
      return {
        enclosingNode: stepHierarchy,
        indexInEnclosingNode: topLevelIndex,
      }
    }
    if (topLevelItem.type === 'thermocyclerProfileGroup') {
      for (
        let indexInGroup = 0;
        indexInGroup < topLevelItem.concurrentSteps.length;
        indexInGroup++
      ) {
        const itemInGroup = topLevelItem.concurrentSteps[indexInGroup]
        if (itemInGroup.stepId === stepIdToFind) {
          return {
            enclosingNode: topLevelItem,
            indexInEnclosingNode: indexInGroup,
          }
        }
      }
    }
  }

  return null
}

/**
 * Returns what the new order of steps will be after a step is moved.
 */
export function computeStepMove(
  originalStepHierarchy: StepHierarchy,
  params: MoveStepParams
): MoveStepResult {
  const popResult = popFromStepHierarchy(
    originalStepHierarchy,
    params.movedStepId
  )
  const { poppedItem: movedItem, newStepHierarchy: stepHierarchyWithoutItem } =
    popResult

  if (movedItem == null) {
    console.error(
      `Couldn't find item being moved. Looking for ${params.movedStepId}.`
    )
    return { isMoveAllowed: false }
  }

  const insertResult: InsertResult = (() => {
    switch (params.moveType) {
      case 'insertBeforeDestinationStep': {
        if (params.movedStepId === params.destinationStepId) {
          return { isAllowed: true, stepHierarchy: originalStepHierarchy }
        } else {
          return insertBeforeDestinationStep(
            stepHierarchyWithoutItem,
            movedItem,
            params.destinationStepId
          )
        }
      }
      case 'insertAsLastStepOfGroup': {
        return insertAsLastStepOfGroup(
          stepHierarchyWithoutItem,
          movedItem,
          params.destinationGroupRootStepId
        )
      }
    }
  })()

  return insertResult.isAllowed
    ? {
        isMoveAllowed: true,
        stepsAfterMove: insertResult.stepHierarchy,
      }
    : { isMoveAllowed: false }
}

interface InsertResult {
  isAllowed: boolean
  stepHierarchy: StepHierarchy
}

function insertBeforeDestinationStep(
  stepHierarchy: StepHierarchy,
  toInsert: StandaloneStep | ThermocyclerProfileGroup,
  destinationStepId: StepIdType
): InsertResult {
  return produce<InsertResult>({ isAllowed: false, stepHierarchy }, draft => {
    const findResult = findStep(draft.stepHierarchy, destinationStepId)
    if (findResult == null) {
      console.error(
        `Couldn't find insertion point. Looking for step ID ${destinationStepId}.`
      )
      draft.isAllowed = false
    } else if ('topLevelItems' in findResult.enclosingNode) {
      findResult.enclosingNode.topLevelItems.splice(
        findResult.indexInEnclosingNode,
        0,
        toInsert
      )
      draft.isAllowed = true
    } else {
      if (toInsert.type === 'thermocyclerProfileGroup') {
        // Concurrent step groups can't be inserted into other concurrent step groups.
        // This is disallowed mostly for UX reasons; we could probably technically support it.
        draft.isAllowed = false
      } else {
        findResult.enclosingNode.concurrentSteps.splice(
          findResult.indexInEnclosingNode,
          0,
          toInsert
        )
        draft.isAllowed = true
      }
    }
  })
}

function insertAsLastStepOfGroup(
  stepHierarchy: StepHierarchy,
  toInsert: StandaloneStep | ThermocyclerProfileGroup,
  destinationGroupRootStepId: StepIdType
): InsertResult {
  if (toInsert.type === 'thermocyclerProfileGroup') {
    // Concurrent step groups can't be inserted into other concurrent step groups.
    // This is disallowed mostly for UX reasons; we could probably technically support it.
    return { isAllowed: false, stepHierarchy }
  }

  return produce<InsertResult>({ isAllowed: false, stepHierarchy }, draft => {
    const matchingGroupDraft = draft.stepHierarchy.topLevelItems.find(
      (item): item is ThermocyclerProfileGroup =>
        item.type === 'thermocyclerProfileGroup' &&
        item.thermocyclerProfileStepId === destinationGroupRootStepId
    )
    if (matchingGroupDraft != null) {
      matchingGroupDraft.concurrentSteps.push(toInsert)
      draft.isAllowed = true
    } else {
      console.error(
        `Couldn't find insertion point. Looking for group rooted at step ID ${destinationGroupRootStepId}.`
      )
      draft.isAllowed = false
    }
  })
}

interface PopResult {
  /** The item that was removed, or null if no matching element was found. */
  poppedItem: StandaloneStep | ThermocyclerProfileGroup | null
  newStepHierarchy: StepHierarchy
}

/**
 * Find an item anywhere in a step hierarchy.
 * Return that item, and a copy of the step hierarchy with that item removed.
 *
 * If the given step ID points to the root of a concurrent group, that entire group
 * is removed.
 */
function popFromStepHierarchy(
  stepHierarchy: StepHierarchy,
  toRemove: StepIdType
): PopResult {
  return produce<PopResult>(
    { poppedItem: null, newStepHierarchy: stepHierarchy },
    draft => {
      const findResult = findStep(draft.newStepHierarchy, toRemove)
      if (findResult == null) {
        // No match. Return the unmodified draft, which should be a no-match result.
        return
      }

      const { enclosingNode: draftEnclosingNode, indexInEnclosingNode } =
        findResult
      const draftArrayToSplice =
        'topLevelItems' in draftEnclosingNode
          ? draftEnclosingNode.topLevelItems
          : draftEnclosingNode.concurrentSteps
      draft.poppedItem = draftArrayToSplice[indexInEnclosingNode]
      draftArrayToSplice.splice(indexInEnclosingNode, 1)
    }
  )
}
