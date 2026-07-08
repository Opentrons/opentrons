import { produce } from 'immer'

import {
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
} from '@opentrons/step-generation'

import {
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
} from '/protocol-designer/constants'

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
 *
 * The same nesting applies to Vacuum module profile steps and timed Vacuum state steps.
 */
export interface StepHierarchy {
  topLevelItems: Array<StandaloneStep | ConcurrentGroup>
}

/** A normal, standalone step. */
export interface StandaloneStep {
  type: 'standaloneStep'
  stepId: StepIdType
}

/**
 * The root step that opens a concurrent block, the steps that run alongside it, and the
 * hidden pause that waits for the block to finish (Thermocycler profile, vacuum profile,
 * or timed vacuum state).
 */
export interface ConcurrentGroupFields {
  /** Step that starts the profile / timed state (visible in the timeline). */
  startStepId: StepIdType
  concurrentSteps: StandaloneStep[]
  /** Hidden “wait until complete” pause paired with `startStepId`. */
  waitStepId: StepIdType
}

/** A group of steps representing a Thermocycler profile and stuff happening concurrently to it. */
export interface ThermocyclerProfileGroup extends ConcurrentGroupFields {
  type: 'thermocyclerProfileGroup'
}

/** A group of steps representing a Vacuum profile and stuff happening concurrently to it. */
export interface VacuumProfileGroup extends ConcurrentGroupFields {
  type: 'vacuumProfileGroup'
}

/** Timed Vacuum state (pump with duration) with steps that may run concurrently until the wait pause. */
export interface VacuumStateDurationGroup extends ConcurrentGroupFields {
  type: 'vacuumStateDurationGroup'
}

export type ConcurrentGroup =
  ThermocyclerProfileGroup | VacuumProfileGroup | VacuumStateDurationGroup

export function isConcurrentGroup(
  item: StandaloneStep | ConcurrentGroup
): item is ConcurrentGroup {
  return item.type !== 'standaloneStep'
}
function isVacuumStateWithPumpDuration(step: FormData): boolean {
  return (
    step.stepType === 'vacuum' &&
    step.programType === VACUUM_PROGRAM_STATE &&
    step.pumpDurationCheckbox === true &&
    step.pumpDurationTime != null
  )
}

type OpenConcurrentGroupKind =
  'thermocycler' | 'vacuumProfile' | 'vacuumStateDuration'

interface OpenConcurrentGroup {
  kind: OpenConcurrentGroupKind
  startId: StepIdType
  concurrentStepIds: StepIdType[]
}
/**
 * Given a flat array of steps, return the equivalent hierarchy.
 */
export function convertStepArrayToHierarchy(steps: FormData[]): StepHierarchy {
  return {
    topLevelItems: [..._convertStepArrayToHierarchy(steps)],
  }
}

function* _convertStepArrayToHierarchy(
  steps: FormData[]
): Generator<StandaloneStep | ConcurrentGroup> {
  let currentGroup: OpenConcurrentGroup | null = null

  for (const step of steps) {
    if (
      step.stepType === 'thermocycler' &&
      step.thermocyclerFormType === 'thermocyclerProfile'
    ) {
      if (currentGroup != null) {
        console.error(
          'More than 1 level of step groups trying to nest within each other. This should not be able to happen.'
        )
      }
      currentGroup = {
        kind: 'thermocycler',
        startId: step.id,
        concurrentStepIds: [],
      }
    } else if (
      step.stepType === 'vacuum' &&
      step.programType === VACUUM_PROGRAM_PROFILE
    ) {
      if (currentGroup != null) {
        console.error(
          'More than 1 level of step groups trying to nest within each other. This should not be able to happen.'
        )
      }
      currentGroup = {
        kind: 'vacuumProfile',
        startId: step.id,
        concurrentStepIds: [],
      }
    } else if (isVacuumStateWithPumpDuration(step)) {
      if (currentGroup != null) {
        console.error(
          'More than 1 level of step groups trying to nest within each other. This should not be able to happen.'
        )
      }
      currentGroup = {
        kind: 'vacuumStateDuration',
        startId: step.id,
        concurrentStepIds: [],
      }
    } else if (
      step.stepType === 'pause' &&
      step.pauseAction === PAUSE_UNTIL_TC_PROFILE_COMPLETE
    ) {
      if (currentGroup?.kind === 'thermocycler') {
        yield {
          type: 'thermocyclerProfileGroup',
          startStepId: currentGroup.startId,
          concurrentSteps: currentGroup.concurrentStepIds.map(stepId => ({
            type: 'standaloneStep',
            stepId,
          })),
          waitStepId: step.id,
        }
        currentGroup = null
      } else {
        if (currentGroup == null) {
          console.error(
            'A Thermocycler profile wait step is trying to close a group, but there is no Thermocycler profile group to close. This should not be able to happen.'
          )
        } else {
          console.error(
            'A Thermocycler profile wait step appeared while a different concurrent group was open. This should not be able to happen.'
          )
          currentGroup.concurrentStepIds.push(step.id)
        }
      }
    } else if (
      step.stepType === 'pause' &&
      step.pauseAction === PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE
    ) {
      if (currentGroup?.kind === 'vacuumProfile') {
        yield {
          type: 'vacuumProfileGroup',
          startStepId: currentGroup.startId,
          concurrentSteps: currentGroup.concurrentStepIds.map(stepId => ({
            type: 'standaloneStep',
            stepId,
          })),
          waitStepId: step.id,
        }
        currentGroup = null
      } else {
        if (currentGroup == null) {
          console.error(
            'A Vacuum profile wait step is trying to close a group, but there is no Vacuum profile group to close. This should not be able to happen.'
          )
        } else {
          console.error(
            'A Vacuum profile wait step appeared while a different concurrent group was open. This should not be able to happen.'
          )
          currentGroup.concurrentStepIds.push(step.id)
        }
      }
    } else if (
      step.stepType === 'pause' &&
      step.pauseAction === PAUSE_UNTIL_VACUUM_STATE_COMPLETE
    ) {
      if (currentGroup?.kind === 'vacuumStateDuration') {
        yield {
          type: 'vacuumStateDurationGroup',
          startStepId: currentGroup.startId,
          concurrentSteps: currentGroup.concurrentStepIds.map(stepId => ({
            type: 'standaloneStep',
            stepId,
          })),
          waitStepId: step.id,
        }
        currentGroup = null
      } else {
        if (currentGroup == null) {
          console.error(
            'A Vacuum state wait step is trying to close a group, but there is no timed Vacuum state group to close. This should not be able to happen.'
          )
        } else {
          console.error(
            'A Vacuum state wait step appeared while a different concurrent group was open. This should not be able to happen.'
          )
          currentGroup.concurrentStepIds.push(step.id)
        }
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
    topLevelItem: StandaloneStep | ConcurrentGroup
  ): StepIdType[] => {
    if (topLevelItem.type === 'standaloneStep') {
      return [topLevelItem.stepId]
    }
    if (isConcurrentGroup(topLevelItem)) {
      return [
        topLevelItem.startStepId,
        ...topLevelItem.concurrentSteps.map(s => s.stepId),
        topLevelItem.waitStepId,
      ]
    }
    const _exhaustive: never = topLevelItem
    return _exhaustive
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
 * Recursively search the tree for a given step ID. The step ID can either point to a
 * standalone step, or to the root of a group.
 *
 * The match's location in the tree is returned: either the top-level `StepHierarchy`,
 * if the match was found at the top level, or the concurrent profile group, if the
 * match was found inside that group.
 *
 * Returns `null` if there's no match.
 */
export function findStep(
  stepHierarchy: StepHierarchy,
  stepIdToFind: StepIdType
): null | {
  foundNode: StandaloneStep | ConcurrentGroup
  enclosingNode: StepHierarchy | ConcurrentGroup
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
      (isConcurrentGroup(topLevelItem) &&
        topLevelItem.startStepId === stepIdToFind)
    ) {
      return {
        foundNode: topLevelItem,
        enclosingNode: stepHierarchy,
        indexInEnclosingNode: topLevelIndex,
      }
    }
    if (isConcurrentGroup(topLevelItem)) {
      for (
        let indexInGroup = 0;
        indexInGroup < topLevelItem.concurrentSteps.length;
        indexInGroup++
      ) {
        const itemInGroup = topLevelItem.concurrentSteps[indexInGroup]
        if (itemInGroup.stepId === stepIdToFind) {
          return {
            foundNode: itemInGroup,
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

/**
 * Swap a step with the one immediately above or below it.
 * This is useful for keyboard-based step reordering.
 */
export function computeStepSwap(
  originalStepHierarchy: StepHierarchy,
  stepIdToMove: StepIdType,
  direction: 'up' | 'down'
): StepHierarchy {
  return produce(originalStepHierarchy, draftStepHierarchy => {
    const findResult = findStep(draftStepHierarchy, stepIdToMove)
    if (findResult == null) {
      console.error(
        `Couldn't find step to move. Looking for step ID ${stepIdToMove}.`
      )
      return
    }

    const { enclosingNode, indexInEnclosingNode } = findResult

    // todo(mm, 2025-12-22): This currently only allows reordering steps within a single
    // level of the tree. e.g. if you have an inner step inside a Thermocycler profile
    // group, this method won't work to move it out of the group; it'll stop at the
    // beginning or end of the group and won't be able to "escape".
    //
    // One way to solve this:
    //
    // Define a "pointer type"
    // Define a utility function that returns all the places where a step of a given type could go
    // getStepHierarchyAfterDuplication() could also be greatly simplified
    const enclosingArray =
      'topLevelItems' in enclosingNode
        ? enclosingNode.topLevelItems
        : enclosingNode.concurrentSteps
    const otherIndex = indexInEnclosingNode + (direction === 'down' ? 1 : -1)
    if (otherIndex < 0 || otherIndex >= enclosingArray.length) {
      return
    }
    mutableSwap(enclosingArray, indexInEnclosingNode, otherIndex)
  })
}

interface InsertResult {
  isAllowed: boolean
  stepHierarchy: StepHierarchy
}

function insertBeforeDestinationStep(
  stepHierarchy: StepHierarchy,
  toInsert: StandaloneStep | ConcurrentGroup,
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
      if (isConcurrentGroup(toInsert)) {
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
  toInsert: StandaloneStep | ConcurrentGroup,
  destinationGroupRootStepId: StepIdType
): InsertResult {
  if (isConcurrentGroup(toInsert)) {
    // Concurrent step groups can't be inserted into other concurrent step groups.
    // This is disallowed mostly for UX reasons; we could probably technically support it.
    return { isAllowed: false, stepHierarchy }
  }

  return produce<InsertResult>({ isAllowed: false, stepHierarchy }, draft => {
    const matchingGroupDraft = draft.stepHierarchy.topLevelItems.find(
      item =>
        isConcurrentGroup(item) &&
        item.startStepId === destinationGroupRootStepId
    )
    if (matchingGroupDraft != null && isConcurrentGroup(matchingGroupDraft)) {
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
  poppedItem: StandaloneStep | ConcurrentGroup | null
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

      const {
        enclosingNode: draftEnclosingNode,
        foundNode,
        indexInEnclosingNode,
      } = findResult
      const draftArrayToSplice =
        'topLevelItems' in draftEnclosingNode
          ? draftEnclosingNode.topLevelItems
          : draftEnclosingNode.concurrentSteps
      draft.poppedItem = foundNode
      draftArrayToSplice.splice(indexInEnclosingNode, 1)
    }
  )
}

/**
 * Return the steps that, according to `stepHierarchy`, are "paired" with any step
 * in `stepIds`.
 *
 * Each group in `stepHierarchy` has a pair of exactly one opening step and exactly one
 * closing step.
 */
export function getPairedSteps(
  stepHierarchy: StepHierarchy,
  stepIds: Set<StepIdType>
): Set<StepIdType> {
  const result = new Set<StepIdType>()
  for (const item of stepHierarchy.topLevelItems) {
    if (isConcurrentGroup(item)) {
      if (stepIds.has(item.startStepId)) {
        result.add(item.waitStepId)
      }
      if (stepIds.has(item.waitStepId)) {
        result.add(item.startStepId)
      }
    }
  }
  return result
}

/** Swap the positions of two elements in an array, modifying the array in-place. */
function mutableSwap<T>(arr: T[], indexA: number, indexB: number): void {
  ;[arr[indexA], arr[indexB]] = [arr[indexB], arr[indexA]]
}
