// @flow
import { useConditionalConfirm } from '@opentrons/components'
import cx from 'classnames'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import * as React from 'react'
import { connect, useDispatch } from 'react-redux'

import type { FormData, StepFieldName, StepType } from '../../form-types'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions } from '../../steplist'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType.js'
import type { BaseState } from '../../types'
import { actions as stepsActions } from '../../ui/steps'
import formStyles from '../forms/forms.css'
import { AutoAddPauseUntilTempStepModal } from '../modals/AutoAddPauseUntilTempStepModal'
import { ConfirmDeleteStepModal } from '../modals/ConfirmDeleteStepModal'
import { MoreOptionsModal } from '../modals/MoreOptionsModal'
import { ButtonRow } from './ButtonRow'
import { FormAlerts } from './FormAlerts'
import {
  MagnetForm,
  MixForm,
  MoveLiquidForm,
  PauseForm,
  TemperatureForm,
  ThermocyclerForm,
} from './forms'
import styles from './StepEditForm.css'

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
  formData: ?FormData,
  isNewStep: boolean,
  canSave: boolean,
  isPristineSetTempForm: boolean,
|}

const StepEditFormManager = (props: StepEditFormManagerProps) => {
  const { canSave, formData, isNewStep, isPristineSetTempForm } = props
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
  } = useConditionalConfirm(handleClose, isNewStep)

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
        <ConfirmDeleteStepModal
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showConfirmCancelModal && (
        <ConfirmDeleteStepModal
          heading="Unsaved Step form"
          alertOverlay
          close
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
    formData: stepFormSelectors.getHydratedUnsavedForm(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
    canSave: stepFormSelectors.getCurrentFormCanBeSaved(state),
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
