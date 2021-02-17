// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import {
  getMultiSelectItemIds,
  getMultiSelectFieldValues,
} from '../../ui/steps/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'

export const FormManager = (): React.Node => {
  const multiStepIds = useSelector(getMultiSelectItemIds)
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepIds = useSelector(getMultiSelectItemIds)
  const allSteps = useSelector(stepFormSelectors.getSavedStepForms)

  if (multiStepIds !== null) {
    // not batch edit mode
    if (stepIds === null) return null

    const steps = stepIds.map(id => allSteps[id])
    const countPerType = steps.reduce((acc, step) => {
      const { stepType } = step
      const newCount = acc[stepType] ? acc[stepType] + 1 : 1
      acc[stepType] = newCount
      return acc
    }, {})

    return (
      <>
        <StepSelectionBanner countPerType={countPerType} />
        <BatchEditForm countPerType={countPerType} fieldValues={fieldValues} />
      </>
    )
  }
  return <StepEditForm />
}
