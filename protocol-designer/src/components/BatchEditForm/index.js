// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeBatchEditFieldProps } from './makeBatchEditFieldProps'
import { NoBatchEditSharedSettings } from './NoBatchEditSharedSettings'
import {
  getBatchEditSelectedStepTypes,
  getMultiSelectDisabledFields,
  getMultiSelectFieldValues,
  getMultiSelectItemIds,
} from '../../ui/steps/selectors'
import { getBatchEditMixEnabled } from '../../feature-flags/selectors'
import { getBatchEditFormHasUnsavedChanges } from '../../step-forms/selectors'
import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'
import { maskField } from '../../steplist/fieldLevel'
import { BatchEditMoveLiquid } from './BatchEditMoveLiquid'
import { BatchEditMix } from './BatchEditMix'

export type BatchEditFormProps = {||}

export const BatchEditForm = (props: BatchEditFormProps): React.Node => {
  const dispatch = useDispatch()
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const batchEditFormHasChanges = useSelector(getBatchEditFormHasUnsavedChanges)
  const batchEditMixEnabled = useSelector(getBatchEditMixEnabled)

  const handleChangeFormInput = (name, value) => {
    const maskedValue = maskField(name, value)
    dispatch(changeBatchEditField({ [name]: maskedValue }))
  }

  const handleSave = () => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleCancel = () => dispatch(resetBatchEditFieldChanges())

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
        if (batchEditMixEnabled) {
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
  }

  return <NoBatchEditSharedSettings />
}
