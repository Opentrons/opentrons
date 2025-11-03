import type { StepIdType } from '/protocol-designer/form-types'

export const getNextNonTerminalItemId = (
  orderedStepIds: StepIdType[],
  stepsToDelete: StepIdType[]
): StepIdType | null => {
  let highestDeletedIndex = stepsToDelete.reduce((highestIndex, val) => {
    const currentStepIndex = orderedStepIds.indexOf(val)
    return Math.max(currentStepIndex, highestIndex)
  }, 0)
  let nextStepId = orderedStepIds[highestDeletedIndex + 1]
  let attemptsLeft = orderedStepIds.length

  while (!nextStepId && attemptsLeft > 0) {
    attemptsLeft -= 1
    highestDeletedIndex -= 1
    const potentialNextStepId = orderedStepIds[highestDeletedIndex]

    if (stepsToDelete.includes(potentialNextStepId)) {
      // if the step id is being deleted, it does not count
      continue
    }

    nextStepId = potentialNextStepId
  }

  return nextStepId ?? null
}
