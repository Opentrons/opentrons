// @flow
import * as React from 'react'
import { useDispatch, connect } from 'react-redux'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import cx from 'classnames'

import { useConditionalConfirm } from '@opentrons/components'
import { actions } from '../../steplist'
import { actions as stepsActions } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType.js'
import formStyles from '../forms/forms.css'
import { MoreOptionsModal } from '../modals/MoreOptionsModal'
import { AutoAddPauseUntilTempStepModal } from '../modals/AutoAddPauseUntilTempStepModal'
import {
  ConfirmDeleteModal,
  UNSAVED_STEP_FORM_CLOSE,
  UNSAVED_STEP_FORM_DELETE,
} from '../modals/ConfirmDeleteModal'

import {
  MixForm,
  MoveLiquidForm,
  PauseForm,
  MagnetForm,
  TemperatureForm,
  ThermocyclerForm,
} from './forms'
import { FormAlerts } from './FormAlerts'
import { ButtonRow } from './ButtonRow'
import styles from './StepEditForm.css'

import type { BaseState } from '../../types'
import type { FormData, StepType, StepFieldName } from '../../form-types'

const STEP_FORM_MAP: { [StepType]: ?React.ComponentType<any> } = {
  mix: MixForm,
  pause: PauseForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
  thermocycler: ThermocyclerForm,
}

type Props = {|
  formData: FormData,
  handleClose: () => mixed,
  canSave: boolean,
  handleDelete: () => mixed,
  handleSave: () => mixed,
  showMoreOptionsModal: boolean,
  focusedField: string | null,
  onFieldBlur: StepFieldName => mixed,
  onFieldFocus: StepFieldName => mixed,
  toggleMoreOptionsModal: () => mixed,
  dirtyFields: Array<string>,
|}

export const StepEditFormComponent = (props: Props): React.Node => {
  const {
    formData,
    canSave,
    handleClose,
    handleDelete,
    dirtyFields,
    handleSave,
    showMoreOptionsModal,
    toggleMoreOptionsModal,
    focusedField,
    onFieldFocus,
    onFieldBlur,
  } = props

  const FormComponent: $Values<typeof STEP_FORM_MAP> = get(
    STEP_FORM_MAP,
    formData.stepType
  )
  if (!FormComponent) {
    // early-exit if step form doesn't exist
    return (
      <div className={formStyles.form}>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }
  return (
    <>
      {showMoreOptionsModal && (
        <MoreOptionsModal formData={formData} close={toggleMoreOptionsModal} />
      )}
      <FormAlerts focusedField={focusedField} dirtyFields={dirtyFields} />
      <div className={cx(formStyles.form, styles[formData.stepType])}>
        <FormComponent
          stepType={formData.stepType} // TODO: Ian 2019-01-17 deprecate passing this during #2916, it's in formData
          formData={formData}
          focusHandlers={{
            focusedField,
            dirtyFields,
            onFieldFocus,
            onFieldBlur,
          }}
        />
        <ButtonRow
          handleClickMoreOptions={toggleMoreOptionsModal}
          handleClose={handleClose}
          handleSave={handleSave}
          handleDelete={handleDelete}
          canSave={canSave}
        />
      </div>
    </>
  )
}

// TODO: type fieldNames, don't use `string`
const getDirtyFields = (
  isNewStep: boolean,
  formData: ?FormData
): Array<string> => {
  let dirtyFields = []
  if (formData == null) {
    return []
  }
  if (!isNewStep) {
    dirtyFields = Object.keys(formData)
  } else {
    const data = formData
    // new step, but may have auto-populated fields.
    // "Dirty" any fields that differ from default new form values
    const defaultFormData = getDefaultsForStepType(formData.stepType)
    dirtyFields = Object.keys(defaultFormData).reduce(
      (acc, fieldName: StepFieldName) => {
        const currentValue = data[fieldName]
        const initialValue = defaultFormData[fieldName]

        return isEqual(currentValue, initialValue) ? acc : [...acc, fieldName]
      },
      []
    )
  }
  // exclude form "metadata" (not really fields)
  return without(dirtyFields, 'stepType', 'id')
}

type StepEditFormManagerProps = {|
  // TODO(IL, 2020-04-22): use HydratedFormData type see #3161
  canSave: boolean,
  formData: ?FormData,
  formHasChanges: boolean,
  isNewStep: boolean,
  isPristineSetTempForm: boolean,
|}

const StepEditFormManager = (props: StepEditFormManagerProps) => {
  const {
    canSave,
    formData,
    isNewStep,
    formHasChanges,
    isPristineSetTempForm,
  } = props

  const [
    showMoreOptionsModal,
    setShowMoreOptionsModal,
  ] = React.useState<boolean>(false)
  const [focusedField, setFocusedField] = React.useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = React.useState<Array<StepFieldName>>(
    getDirtyFields(isNewStep, formData)
  )

  const toggleMoreOptionsModal = () => {
    setShowMoreOptionsModal(!showMoreOptionsModal)
  }

  const onFieldFocus = (fieldName: StepFieldName) => {
    setFocusedField(fieldName)
  }

  const onFieldBlur = (fieldName: StepFieldName) => {
    if (fieldName === focusedField) {
      setFocusedField(null)
    }
    if (!dirtyFields.includes(fieldName)) {
      setDirtyFields([...dirtyFields, fieldName])
    }
  }

  const dispatch = useDispatch()
  const stepId = formData?.id
  const handleDelete = () => {
    if (stepId != null) {
      dispatch(actions.deleteStep(stepId))
    } else {
      console.error(
        `StepEditForm: tried to delete step with no step id, this should not happen`
      )
    }
  }
  const handleClose = () => dispatch(actions.cancelStepForm())
  const saveSetTempFormWithAddedPauseUntilTemp = () =>
    dispatch(stepsActions.saveSetTempFormWithAddedPauseUntilTemp())
  const saveStepForm = () => dispatch(stepsActions.saveStepForm())

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

  return (
    <>
      {showConfirmDeleteModal && (
        <ConfirmDeleteModal
          modalType={UNSAVED_STEP_FORM_DELETE}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showConfirmCancelModal && (
        <ConfirmDeleteModal
          modalType={UNSAVED_STEP_FORM_CLOSE}
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
          formData,
          dirtyFields,
          handleClose: confirmClose,
          handleDelete: confirmDelete,
          handleSave: isPristineSetTempForm
            ? confirmAddPauseUntilTempStep
            : saveStepForm,
          focusedField,
          onFieldBlur,
          onFieldFocus,
          showMoreOptionsModal,
          toggleMoreOptionsModal,
        }}
      />
    </>
  )
}

const mapStateToProps = (state: BaseState): StepEditFormManagerProps => {
  return {
    canSave: stepFormSelectors.getCurrentFormCanBeSaved(state),
    formData: stepFormSelectors.getHydratedUnsavedForm(state),
    formHasChanges: stepFormSelectors.getCurrentFormHasUnsavedChanges(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
    isPristineSetTempForm: stepFormSelectors.getUnsavedFormIsPristineSetTempForm(
      state
    ),
  }
}

// NOTE(IL, 2020-04-22): This is using connect instead of useSelector in order to
// avoid zombie children in the many connected field components.
// (Children of a useSelector parent must always be written to use selectors defensively
// if their parent (StepEditForm) is NOT using connect.
// It doesn't matter if the children are using connect or useSelector,
// only the parent matters.)
// https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
export const StepEditForm: React.AbstractComponent<{||}> = connect<
  StepEditFormManagerProps,
  {||},
  _,
  _,
  _,
  _
>(
  mapStateToProps,
  () => ({}) // no `dispatch` prop
)((props: StepEditFormManagerProps) => (
  // key by ID so manager state doesn't persist across different forms
  <StepEditFormManager key={props.formData?.id ?? 'empty'} {...props} />
))
