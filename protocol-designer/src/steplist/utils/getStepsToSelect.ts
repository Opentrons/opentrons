import { getStepVisibilities } from './getStepVisibilities'
import { convertStepHierarchyToArray } from './stepHierarchy'

import type { StepIdType } from '/protocol-designer/form-types'
import type { StepHierarchy } from './stepHierarchy'

/**
 * When the user deletes steps, this chooses which step we should automatically
 * select after the deletion.
 *
 * @param originalStepHierarchy The steps before anything's been deleted.
 *
 * @param stepsToDelete The IDs of individual steps that are being deleted.
 *     If a group is being deleted (see `StepHierarchy`), include the group's start
 *     AND end steps. If the steps inside the group are also being deleted, those
 *     need to be included separately.
 */
export function getStepToSelectAfterDeletion(
  originalStepHierarchy: StepHierarchy,
  stepsToDelete: Set<StepIdType>
): StepIdType | null {
  const flatStepIds = convertStepHierarchyToArray(originalStepHierarchy)
  const visibilities = getStepVisibilities(originalStepHierarchy)
  const highestDeletedIndex = flatStepIds.findLastIndex(stepId =>
    stepsToDelete.has(stepId)
  )
  if (highestDeletedIndex === -1) {
    return null
  }

  const stepIsSelectable = (stepId: StepIdType): boolean =>
    visibilities[stepId].isVisibleToUser && !stepsToDelete.has(stepId)

  const nextSelectableId = flatStepIds
    .slice(highestDeletedIndex + 1)
    .find(stepIsSelectable)
  const prevSelectableId = flatStepIds
    .slice(0, highestDeletedIndex)
    .findLast(stepIsSelectable)

  return nextSelectableId ?? prevSelectableId ?? null
}

/**
 * When the user duplicates steps, this chooses which steps we should automatically
 * select after the duplication.
 *
 * @param stepHierarchyAfterDuplication: The steps after the duplication operation.
 * @param newStepIds: The IDs of the steps that the duplication operation added.
 * @return The steps we should select, in timeline order.
 */
export function getStepsToSelectAfterDuplication(
  stepHierarchyAfterDuplication: StepHierarchy,
  newStepIds: Set<StepIdType>
): StepIdType[] {
  const flatStepIds = convertStepHierarchyToArray(stepHierarchyAfterDuplication)
  const visibilities = getStepVisibilities(stepHierarchyAfterDuplication)
  return flatStepIds.filter(
    stepId => visibilities[stepId].isVisibleToUser && newStepIds.has(stepId)
  )
}
