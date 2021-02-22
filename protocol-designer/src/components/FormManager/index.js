// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import {
  getBatchEditSelectedStepTypes,
  getIsMultiSelectMode,
  getMultiSelectFieldValues,
} from '../../ui/steps/selectors'

export const FormManager = (): React.Node => {
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)

  // TODO(IL, 2021-02-17): dispatch changeBatchEditField here in #7222
  const handleChangeFormInput = (name, value) => {
    console.log(`TODO: update ${name}: ${String(value)}`)
  }

  if (isMultiSelectMode) {
    return (
      <>
        <StepSelectionBanner />
        <BatchEditForm
          fieldValues={fieldValues}
          handleChangeFormInput={handleChangeFormInput}
          stepTypes={stepTypes}
        />
      </>
    )
  }
  return <StepEditForm />
}
