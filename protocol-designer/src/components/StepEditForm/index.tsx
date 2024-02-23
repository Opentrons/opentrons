import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import { actions } from '../../steplist'
import { actions as stepsActions } from '../../ui/steps'
import { resetScrollElements } from '../../ui/steps/utils'
import {
  getHydratedForm,
  selectors as stepFormSelectors,
} from '../../step-forms'
import { maskField } from '../../steplist/fieldLevel'
import { getInvariantContext } from '../../step-forms/selectors'
import { AutoAddPauseUntilTempStepModal } from '../modals/AutoAddPauseUntilTempStepModal'
import { AutoAddPauseUntilHeaterShakerTempStepModal } from '../modals/AutoAddPauseUntilHeaterShakerTempStepModal'
import {
  ConfirmDeleteModal,
  DELETE_STEP_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
} from '../modals/ConfirmDeleteModal'
import { makeSingleEditFieldProps } from './fields/makeSingleEditFieldProps'
import { StepEditFormComponent } from './StepEditFormComponent'
import { getDirtyFields } from './utils'

import type { ThunkDispatch } from '../../types'
import type { StepFieldName, StepIdType } from '../../form-types'

export const StepEditForm = (): JSX.Element | null => {
  const { t } = useTranslation('tooltip')
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const canSave = useSelector(stepFormSelectors.getCurrentFormCanBeSaved)
  const formData = useSelector(stepFormSelectors.getUnsavedForm)
  const formHasChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )
  const isNewStep = useSelector(stepFormSelectors.getCurrentFormIsPresaved)
  const isPristineSetHeaterShakerTempForm = useSelector(
    stepFormSelectors.getUnsavedFormIsPristineHeaterShakerForm
  )
  const isPristineSetTempForm = useSelector(
    stepFormSelectors.getUnsavedFormIsPristineSetTempForm
  )
  const invariantContext = useSelector(getInvariantContext)
  const deleteStep = (stepId: StepIdType): void =>
    dispatch(actions.deleteStep(stepId))
  const handleClose = (): void => dispatch(actions.cancelStepForm())
  const saveHeaterShakerFormWithAddedPauseUntilTemp = (): void =>
    dispatch(stepsActions.saveHeaterShakerFormWithAddedPauseUntilTemp())
  const saveSetTempFormWithAddedPauseUntilTemp = (): void =>
    dispatch(stepsActions.saveSetTempFormWithAddedPauseUntilTemp())
  const saveStepForm = (): void => dispatch(stepsActions.saveStepForm())

  const handleChangeFormInput = (name: string, value: unknown): void => {
    const maskedValue = maskField(name, value)
    dispatch(actions.changeFormInput({ update: { [name]: maskedValue } }))
  }

  const [
    showMoreOptionsModal,
    setShowMoreOptionsModal,
  ] = React.useState<boolean>(false)
  const [focusedField, setFocusedField] = React.useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = React.useState<StepFieldName[]>(
    getDirtyFields(isNewStep, formData)
  )

  const toggleMoreOptionsModal = (): void => {
    resetScrollElements()
    setShowMoreOptionsModal(!showMoreOptionsModal)
  }

  const focus = setFocusedField

  const blur = (fieldName: StepFieldName): void => {
    if (fieldName === focusedField) {
      setFocusedField(null)
    }
    if (!dirtyFields.includes(fieldName)) {
      setDirtyFields([...dirtyFields, fieldName])
    }
  }

  const stepId = formData?.id
  const handleDelete = (): void => {
    if (stepId != null) {
      deleteStep(stepId)
    } else {
      console.error(
        `StepEditForm: tried to delete step with no step id, this should not happen`
      )
    }
  }

  const {
    confirm: confirmDelete,
    showConfirmation: showConfirmDeleteModal,
    cancel: cancelDelete,
  } = useConditionalConfirm(handleDelete, true)

  const {
    confirm: confirmClose,
    showConfirmation: showConfirmCancelModal,
    cancel: cancelClose,
  } = useConditionalConfirm(handleClose, isNewStep || formHasChanges)

  const {
    confirm: confirmAddPauseUntilTempStep,
    showConfirmation: showAddPauseUntilTempStepModal,
  } = useConditionalConfirm(
    saveSetTempFormWithAddedPauseUntilTemp,
    isPristineSetTempForm
  )

  const {
    confirm: confirmAddPauseUntilHeaterShakerTempStep,
    showConfirmation: showAddPauseUntilHeaterShakerTempStepModal,
  } = useConditionalConfirm(
    saveHeaterShakerFormWithAddedPauseUntilTemp,
    isPristineSetHeaterShakerTempForm
  )

  // no form selected
  if (formData == null) {
    return null
  }

  const hydratedForm = getHydratedForm(formData, invariantContext)

  const focusHandlers = {
    focusedField,
    dirtyFields,
    focus,
    blur,
  }

  const propsForFields = makeSingleEditFieldProps(
    focusHandlers,
    formData,
    handleChangeFormInput,
    hydratedForm,
    t
  )
  let handleSave = saveStepForm
  if (isPristineSetTempForm) {
    handleSave = confirmAddPauseUntilTempStep
  } else if (
    isPristineSetHeaterShakerTempForm &&
    formData.heaterShakerSetTimer !== true
  ) {
    handleSave = confirmAddPauseUntilHeaterShakerTempStep
  }

  return (
    <React.Fragment key={formData.id}>
      {showConfirmDeleteModal && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showConfirmCancelModal && (
        <ConfirmDeleteModal
          modalType={
            isNewStep ? CLOSE_UNSAVED_STEP_FORM : CLOSE_STEP_FORM_WITH_CHANGES
          }
          onCancelClick={cancelClose}
          onContinueClick={confirmClose}
        />
      )}
      {showAddPauseUntilTempStepModal && (
        <AutoAddPauseUntilTempStepModal
          displayTemperature={formData?.targetTemperature ?? '?'}
          handleCancelClick={saveStepForm}
          handleContinueClick={confirmAddPauseUntilTempStep}
        />
      )}
      {showAddPauseUntilHeaterShakerTempStepModal && (
        <AutoAddPauseUntilHeaterShakerTempStepModal
          displayTemperature={formData?.targetHeaterShakerTemperature ?? '?'}
          handleCancelClick={saveStepForm}
          handleContinueClick={confirmAddPauseUntilHeaterShakerTempStep}
        />
      )}
      <StepEditFormComponent
        {...{
          canSave,
          dirtyFields,
          focusedField,
          focusHandlers,
          formData,
          handleClose: confirmClose,
          handleDelete: confirmDelete,
          handleSave,
          propsForFields,
          showMoreOptionsModal,
          toggleMoreOptionsModal,
        }}
      />
    </React.Fragment>
  )
}
