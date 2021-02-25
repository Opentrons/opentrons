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
  getMultiSelectItemIds,
} from '../../ui/steps/selectors'
import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'

export const FormManager = (): React.Node => {
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const dispatch = useDispatch()
  const selectedStepIds = useSelector(getMultiSelectItemIds)

  const handleChangeFormInput = (name, value) => {
    dispatch(changeBatchEditField({ [name]: value }))
  }

  const handleSaveMultiSelect = () => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleClose = () => dispatch(resetBatchEditFieldChanges())

  if (isMultiSelectMode) {
    return (
      <>
        <StepSelectionBanner />
        <BatchEditForm
          fieldValues={fieldValues}
          disabledFields={disabledFields}
          handleChangeFormInput={handleChangeFormInput}
          stepTypes={stepTypes}
          handleClose={handleClose}
          handleSave={handleSaveMultiSelect}
        />
      </>
    )
  }
  return <StepEditForm />
}
