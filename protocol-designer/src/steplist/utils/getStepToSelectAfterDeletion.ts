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
  const flatSteps = getFlatSteps(originalStepHierarchy)
  const highestDeletedIndex = flatSteps.findLastIndex(value =>
    stepsToDelete.has(value.stepId)
  )
  if (highestDeletedIndex === -1) {
    return null
  }

  const stepIsSelectable = (step: Step): boolean =>
    step.isVisibleToUser && !stepsToDelete.has(step.stepId)

  const selectableStepsFollowing = flatSteps
    .slice(highestDeletedIndex, undefined)
    .filter(stepIsSelectable)
  const selectableStepsPreceding = flatSteps
    .slice(undefined, highestDeletedIndex)
    .filter(stepIsSelectable)

  const selection =
    selectableStepsFollowing.at(0) ?? selectableStepsPreceding.at(-1) ?? null
  return selection?.stepId ?? null
}

interface Step {
  stepId: StepIdType
  /**
   * Thermocycler profiles have an implicit "wait for profile to complete" step at the
   * end, not shown in the UI. This is `false` for steps like that. See `StepHierarchy`.
   */
  isVisibleToUser: boolean
}

function getFlatSteps(stepHierarchy: StepHierarchy): Step[] {
  const getStepsContainedInTopLevelItem = (
    topLevelItem: StepHierarchy['topLevelItems'][number]
  ): Step[] => {
    switch (topLevelItem.type) {
      case 'standaloneStep':
        return [{ stepId: topLevelItem.stepId, isVisibleToUser: true }]
      case 'thermocyclerProfileGroup':
        return [
          {
            stepId: topLevelItem.thermocyclerProfileStepId,
            isVisibleToUser: true,
          },
          ...topLevelItem.concurrentSteps.map(step => ({
            stepId: step.stepId,
            isVisibleToUser: true,
          })),
          {
            stepId: topLevelItem.waitForThermocyclerProfileStepId,
            isVisibleToUser: false,
          },
        ]
    }
  }
  return stepHierarchy.topLevelItems.flatMap(getStepsContainedInTopLevelItem)
}
