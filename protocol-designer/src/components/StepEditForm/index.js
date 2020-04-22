// @flow
import React, { useState, type ComponentType } from 'react'
import { useDispatch, connect } from 'react-redux'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import cx from 'classnames'

import { useConditionalConfirm } from '../useConditionalConfirm'
import { actions } from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType.js'
import formStyles from '../forms/forms.css'
import { MoreOptionsModal } from '../modals/MoreOptionsModal'
import { ConfirmDeleteStepModal } from '../modals/ConfirmDeleteStepModal'
import {
  MixForm,
  MoveLiquidForm,
  PauseForm,
  MagnetForm,
  TemperatureForm,
} from './forms'
import { FormAlerts } from './FormAlerts'
import { ButtonRow } from './ButtonRow'
import styles from './StepEditForm.css'

import type { BaseState } from '../../types'
import type { FormData, StepType, StepFieldName } from '../../form-types'

const STEP_FORM_MAP: { [StepType]: ?ComponentType<any> } = {
  mix: MixForm,
  pause: PauseForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
}

type Props = {|
  formData: FormData,
  deleteStep: () => mixed,
  showMoreOptionsModal: boolean,
  focusedField: string | null,
  onFieldBlur: StepFieldName => mixed,
  onFieldFocus: StepFieldName => mixed,
  toggleMoreOptionsModal: () => mixed,
  dirtyFields: Array<string>,
|}

export const StepEditFormComponent = (props: Props) => {
  const {
    formData,
    deleteStep,
    dirtyFields,
    showMoreOptionsModal,
    toggleMoreOptionsModal,
    focusedField,
    onFieldFocus,
    onFieldBlur,
  } = props

  const formHasChanges = true // TODO IMMEDIATELY make stateful, maybe set to true on onFieldBlur??
  const {
    conditionalContinue: conditionalDelete,
    requiresConfirmation: showConfirmDeleteModal, // TODO IMMEDIATELY Rename this property to make it clearer, on useConditionalConfirm
    confirmAndContinue: confirmDelete,
    cancelConfirm: cancelConfirmDelete,
  } = useConditionalConfirm(deleteStep, formHasChanges)

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
    <React.Fragment>
      {showConfirmDeleteModal && (
        <ConfirmDeleteStepModal
          onCancelClick={cancelConfirmDelete}
          onContinueClick={confirmDelete}
        />
      )}
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
          onClickMoreOptions={toggleMoreOptionsModal}
          onDelete={conditionalDelete}
        />
      </div>
    </React.Fragment>
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
  } else if (formData.stepType) {
    const data = formData
    // new step, but may have auto-populated fields.
    // "Dirty" any fields that differ from default new form values
    const defaultFormData = getDefaultsForStepType(formData.stepType)
    dirtyFields = Object.keys(defaultFormData).reduce(
      (acc, fieldName: StepFieldName) => {
        // formData is no longer a Maybe type b/c of the `if` above, but flow forgets
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
|}

const StepEditFormManager = (props: StepEditFormManagerProps) => {
  const { isNewStep, formData } = props
  const [showMoreOptionsModal, setShowMoreOptionsModal] = useState<boolean>(
    false
  )
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = useState<Array<StepFieldName>>(
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

  // no form selected
  if (formData == null) {
    return null
  }

  const stepId = formData.id
  const deleteStep = () => dispatch(actions.deleteStep(stepId))

  return (
    <StepEditFormComponent
      {...{
        formData,
        dirtyFields,
        deleteStep,
        focusedField,
        onFieldBlur,
        onFieldFocus,
        showMoreOptionsModal,
        toggleMoreOptionsModal,
      }}
    />
  )
}

const mapStateToProps = (state: BaseState): StepEditFormManagerProps => {
  return {
    formData: stepFormSelectors.getHydratedUnsavedForm(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
  }
}

// NOTE(IL, 2020-04-22): This is using connect instead of useSelector in order to
// avoid zombie children in the many connected field components.
// (Children of a useSelector parent must always be written to use selectors defensively
// if their parent (StepEditForm) is NOT using connect.
// It doesn't matter if the children are using connect or useSelector,
// only the parent matters.)
// https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
export const StepEditForm = connect<StepEditFormManagerProps, {||}, _, _, _, _>(
  mapStateToProps,
  () => ({}) // no `dispatch` prop
)(StepEditFormManager)
