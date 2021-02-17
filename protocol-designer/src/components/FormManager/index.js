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
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepIds = useSelector(getMultiSelectItemIds)
  const allSteps = useSelector(stepFormSelectors.getSavedStepForms)

  // TODO(IL, 2021-02-17): dispatch changeBatchEditField here in #7222
  const handleChangeFormInput = (name, value) => {
    console.log(`TODO: update ${name}: ${String(value)}`)
  }

  if (fieldValues !== null && stepIds !== null) {
    // batch edit mode
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
        <BatchEditForm
          countPerType={countPerType}
          fieldValues={fieldValues}
          handleChangeFormInput={handleChangeFormInput}
        />
      </>
    )
  }
  return <StepEditForm />
}
