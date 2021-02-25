// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import {
  getBatchEditSelectedStepTypes,
  getIsMultiSelectMode,
  getMultiSelectDisabledFields,
  getMultiSelectFieldValues,
} from '../../ui/steps/selectors'
import { changeBatchEditField } from '../../step-forms/actions'

export const FormManager = (): React.Node => {
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const dispatch = useDispatch()

  const handleChangeFormInput = (name, value) => {
    dispatch(changeBatchEditField({ [name]: value }))
  }

  if (isMultiSelectMode) {
    return (
      <>
        <StepSelectionBanner />
        <BatchEditForm
          fieldValues={fieldValues}
          disabledFields={disabledFields}
          handleChangeFormInput={handleChangeFormInput}
          stepTypes={stepTypes}
        />
      </>
    )
  }
  return <StepEditForm />
}
