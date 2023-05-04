import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'
import { getBatchEditFormHasUnsavedChanges } from '../../step-forms/selectors'
import { maskField, StepFieldName } from '../../steplist/fieldLevel'
import {
  getBatchEditSelectedStepTypes,
  getMultiSelectDisabledFields,
  getMultiSelectFieldValues,
  getMultiSelectItemIds,
} from '../../ui/steps/selectors'
import { BatchEditMix } from './BatchEditMix'
import { BatchEditMoveLiquid } from './BatchEditMoveLiquid'
import { NoBatchEditSharedSettings } from './NoBatchEditSharedSettings'
import { makeBatchEditFieldProps } from './makeBatchEditFieldProps'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

export const BatchEditForm = (): JSX.Element => {
  const dispatch = useDispatch()
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const batchEditFormHasChanges = useSelector(getBatchEditFormHasUnsavedChanges)

  const handleChangeFormInput = (name: StepFieldName, value: unknown): void => {
    const maskedValue = maskField(name, value)
    dispatch(changeBatchEditField({ [name]: maskedValue }))
  }

  const handleSave = (): void => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleCancel = (): void => {
    dispatch(resetBatchEditFieldChanges())
  }

  const stepType = stepTypes.length === 1 ? stepTypes[0] : null

  if (stepType !== null && fieldValues !== null && disabledFields !== null) {
    // Valid state for using makeBatchEditFieldProps
    const propsForFields = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput
    )
    switch (stepType) {
      case 'moveLiquid':
        return (
          <BatchEditMoveLiquid
            {...{
              propsForFields,
              handleCancel,
              handleSave,
              batchEditFormHasChanges,
            }}
          />
        )
      case 'mix':
        return (
          <BatchEditMix
            {...{
              propsForFields,
              handleCancel,
              handleSave,
              batchEditFormHasChanges,
            }}
          />
        )
    }
  }

  return <NoBatchEditSharedSettings />
}
