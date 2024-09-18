import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import { actions } from '../../../../steplist'
import { actions as stepsActions } from '../../../../ui/steps'
import {
  getHydratedForm,
  selectors as stepFormSelectors,
} from '../../../../step-forms'
import { maskField } from '../../../../steplist/fieldLevel'
import { getInvariantContext } from '../../../../step-forms/selectors'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
  DELETE_STEP_FORM,
} from '../../../../components/modals/ConfirmDeleteModal'
import { AutoAddPauseUntilTempStepModal } from '../../../../components/modals/AutoAddPauseUntilTempStepModal'
import { AutoAddPauseUntilHeaterShakerTempStepModal } from '../../../../components/modals/AutoAddPauseUntilHeaterShakerTempStepModal'
import { getDirtyFields, makeSingleEditFieldProps } from './utils'
import { StepFormToolbox } from './StepFormToolbox'

import type { InvariantContext } from '@opentrons/step-generation'
import type { BaseState, ThunkDispatch } from '../../../../types'
import type {
  FormData,
  StepFieldName,
  StepIdType,
} from '../../../../form-types'

interface StateProps {
  canSave: boolean
  formData?: FormData | null
  formHasChanges: boolean
  isNewStep: boolean
  isPristineSetTempForm: boolean
  isPristineSetHeaterShakerTempForm: boolean
  invariantContext: InvariantContext
}
interface DispatchProps {
  deleteStep: (stepId: string) => void
  handleClose: () => void
  saveSetTempFormWithAddedPauseUntilTemp: () => void
  saveHeaterShakerFormWithAddedPauseUntilTemp: () => void
  saveStepForm: () => void
  handleChangeFormInput: (name: string, value: unknown) => void
}
type StepEditFormManagerProps = StateProps & DispatchProps

const StepFormManager = (
  props: StepEditFormManagerProps
): JSX.Element | null => {
  const {
    canSave,
    deleteStep,
    formData,
    formHasChanges,
    handleChangeFormInput,
    handleClose,
    isNewStep,
    isPristineSetTempForm,
    isPristineSetHeaterShakerTempForm,
    saveSetTempFormWithAddedPauseUntilTemp,
    saveHeaterShakerFormWithAddedPauseUntilTemp,
    saveStepForm,
    invariantContext,
  } = props
  const { t } = useTranslation('tooltip')
  const [focusedField, setFocusedField] = React.useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = React.useState<StepFieldName[]>(
    getDirtyFields(isNewStep, formData)
  )
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
    <>
      {/* TODO: update these modals to match new modal design */}
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
      <StepFormToolbox
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
        }}
      />
    </>
  )
}

const mapStateToProps = (state: BaseState): StateProps => {
  return {
    canSave: stepFormSelectors.getCurrentFormCanBeSaved(state),
    formData: stepFormSelectors.getUnsavedForm(state),
    formHasChanges: stepFormSelectors.getCurrentFormHasUnsavedChanges(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
    isPristineSetHeaterShakerTempForm: stepFormSelectors.getUnsavedFormIsPristineHeaterShakerForm(
      state
    ),
    isPristineSetTempForm: stepFormSelectors.getUnsavedFormIsPristineSetTempForm(
      state
    ),
    invariantContext: getInvariantContext(state),
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DispatchProps => {
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

  return {
    deleteStep,
    handleChangeFormInput,
    handleClose,
    saveSetTempFormWithAddedPauseUntilTemp,
    saveStepForm,
    saveHeaterShakerFormWithAddedPauseUntilTemp,
  }
}

// NOTE(IL, 2020-04-22): This is using connect instead of useSelector in order to
// avoid zombie children in the many connected field components.
// (Children of a useSelector parent must always be written to use selectors defensively
// if their parent (StepEditForm) is NOT using connect.
// It doesn't matter if the children are using connect or useSelector,
// only the parent matters.)
// https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
export const StepForm = connect(
  mapStateToProps,
  mapDispatchToProps
)((props: StepEditFormManagerProps) => {
  const { formData } = props
  return (
    // key by ID so manager state doesn't persist across different forms
    <StepFormManager key={formData?.id ?? 'empty'} {...props} />
  )
})
