import { useConditionalConfirm } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'
import { actions } from '../../steplist'
import { actions as stepsActions } from '../../ui/steps'
import { resetScrollElements } from '../../ui/steps/utils'
import { selectors as stepFormSelectors } from '../../step-forms'
import { maskField } from '../../steplist/fieldLevel'
import { AutoAddPauseUntilTempStepModal } from '../modals/AutoAddPauseUntilTempStepModal'
import {
  ConfirmDeleteModal,
  DELETE_STEP_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
} from '../modals/ConfirmDeleteModal'
import { makeSingleEditFieldProps } from './fields/makeSingleEditFieldProps'
import { StepEditFormComponent } from './StepEditFormComponent'
import { getDirtyFields } from './utils'
import { BaseState, ThunkDispatch } from '../../types'
import { FormData, StepFieldName, StepIdType } from '../../form-types'

interface SP {
  canSave: boolean
  formData?: FormData | null
  formHasChanges: boolean
  isNewStep: boolean
  isPristineSetTempForm: boolean
}
interface DP {
  deleteStep: (stepId: string) => unknown
  handleClose: () => unknown
  saveSetTempFormWithAddedPauseUntilTemp: () => unknown
  saveStepForm: () => unknown
  handleChangeFormInput: (name: string, value: unknown) => void
}
type StepEditFormManagerProps = SP & DP

const StepEditFormManager = (
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
    saveSetTempFormWithAddedPauseUntilTemp,
    saveStepForm,
  } = props

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

  // no form selected
  if (formData == null) {
    return null
  }

  const focusHandlers = {
    focusedField,
    dirtyFields,
    focus,
    blur,
  }

  const propsForFields = makeSingleEditFieldProps(
    focusHandlers,
    formData,
    handleChangeFormInput
  )

  return (
    <>
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
      <StepEditFormComponent
        {...{
          canSave,
          dirtyFields,
          focusedField,
          focusHandlers,
          formData,
          handleClose: confirmClose,
          handleDelete: confirmDelete,
          handleSave: isPristineSetTempForm
            ? confirmAddPauseUntilTempStep
            : saveStepForm,
          propsForFields,
          showMoreOptionsModal,
          toggleMoreOptionsModal,
        }}
      />
    </>
  )
}

const mapStateToProps = (state: BaseState): SP => {
  return {
    canSave: stepFormSelectors.getCurrentFormCanBeSaved(state),
    formData: stepFormSelectors.getUnsavedForm(state),
    formHasChanges: stepFormSelectors.getCurrentFormHasUnsavedChanges(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
    isPristineSetTempForm: stepFormSelectors.getUnsavedFormIsPristineSetTempForm(
      state
    ),
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => {
  const deleteStep = (stepId: StepIdType): void =>
    dispatch(actions.deleteStep(stepId))
  const handleClose = (): void => dispatch(actions.cancelStepForm())
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
  }
}

// NOTE(IL, 2020-04-22): This is using connect instead of useSelector in order to
// avoid zombie children in the many connected field components.
// (Children of a useSelector parent must always be written to use selectors defensively
// if their parent (StepEditForm) is NOT using connect.
// It doesn't matter if the children are using connect or useSelector,
// only the parent matters.)
// https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
export const StepEditForm = connect(
  mapStateToProps,
  mapDispatchToProps
)((props: StepEditFormManagerProps) => (
  // key by ID so manager state doesn't persist across different forms
  <StepEditFormManager key={props.formData?.id ?? 'empty'} {...props} />
))
