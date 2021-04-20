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
import { Alerts } from '../alerts/Alerts'
import { getBatchEditMixEnabled } from '../../feature-flags/selectors'
import {
  getBatchEditFormHasUnsavedChanges,
  getPipetteEntities,
} from '../../step-forms/selectors'
import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'
import { maskField } from '../../steplist/fieldLevel'
import { VOLUME_TOO_HIGH } from '../../steplist/formLevel/errors'
import { getPipetteCapacity } from '../../pipettes/pipetteData'
import { formErrorToAlertData } from '../StepEditForm/utils'
import { BatchEditMoveLiquid } from './BatchEditMoveLiquid'
import { BatchEditMix } from './BatchEditMix'
import { useMakeFocusHandlers } from '../StepEditForm'
import type { StepType } from '../../form-types'
import type { MultiselectFieldValues } from '../../ui/steps/selectors'
import type { AlertData } from '../alerts/types'
import type { PipetteEntities } from '../../step-forms/types'
import type { FormError } from '../../steplist/formLevel/errors'

export type BatchEditFormProps = {||}

export const volumeTooHigh = (
  fieldValues: MultiselectFieldValues,
  pipetteEntities: PipetteEntities
): FormError | null => {
  const volumeValue = fieldValues.volume.value
  const pipetteId = fieldValues.pipette.value
  if (volumeValue == null || pipetteId == null) {
    // dependent fields are indeterminate, no error
    return null
  }
  const volume = Number(volumeValue)
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteCapacity = getPipetteCapacity(pipetteEntity)
  if (
    !Number.isNaN(volume) &&
    !Number.isNaN(pipetteCapacity) &&
    volume > pipetteCapacity
  ) {
    return VOLUME_TOO_HIGH(pipetteCapacity)
  }
  return null
}

// TODO IMMEDIATELY factor out into different file
export const useGetErrorsForBatchEditForm = (
  stepType: StepType | null,
  fieldValues: MultiselectFieldValues | null,
  pipetteEntities: PipetteEntities
): Array<AlertData> => {
  if (stepType === null || fieldValues === null) {
    return []
  }

  if (stepType === 'mix') {
    return [volumeTooHigh(fieldValues, pipetteEntities)]
      .filter(Boolean)
      .map(formErrorToAlertData)
  }
  return []
}

export const BatchEditForm = (props: BatchEditFormProps): React.Node => {
  const dispatch = useDispatch()
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const batchEditFormHasChanges = useSelector(getBatchEditFormHasUnsavedChanges)
  const batchEditMixEnabled = useSelector(getBatchEditMixEnabled)
  const pipetteEntities = useSelector(getPipetteEntities)

  const handleChangeFormInput = (name, value) => {
    const maskedValue = maskField(name, value)
    dispatch(changeBatchEditField({ [name]: maskedValue }))
  }

  const handleSave = () => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleCancel = () => dispatch(resetBatchEditFieldChanges())

  const stepType = stepTypes.length === 1 ? stepTypes[0] : null

  const formErrors = useGetErrorsForBatchEditForm(
    stepType,
    fieldValues,
    pipetteEntities
  )

  // TODO IMMEDIATELY get initial dirty fields for batch edit (including indeterminate). Or maybe [] is correct??
  const focusHandlers = useMakeFocusHandlers([])

  if (stepType !== null && fieldValues !== null && disabledFields !== null) {
    // Valid state for using makeBatchEditFieldProps
    const propsForFields = makeBatchEditFieldProps(
      focusHandlers,
      fieldValues,
      disabledFields,
      handleChangeFormInput
    )
    const disableSave = !batchEditFormHasChanges || formErrors.length > 0

    const alerts = <Alerts errors={formErrors} warnings={[]} />

    switch (stepType) {
      case 'moveLiquid':
        return (
          <>
            {alerts}
            <BatchEditMoveLiquid
              {...{
                disableSave,
                propsForFields,
                handleCancel,
                handleSave,
              }}
            />
          </>
        )
      case 'mix':
        if (batchEditMixEnabled) {
          return (
            <>
              {alerts}
              <BatchEditMix
                {...{
                  disableSave,
                  propsForFields,
                  handleCancel,
                  handleSave,
                }}
              />
            </>
          )
        }
    }
  }

  return <NoBatchEditSharedSettings />
}
