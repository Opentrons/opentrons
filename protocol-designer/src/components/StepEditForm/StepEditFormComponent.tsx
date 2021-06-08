// @flow
import * as React from 'react'
import cx from 'classnames'
import get from 'lodash/get'
import { MoreOptionsModal } from '../modals/MoreOptionsModal'
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
import formStyles from '../forms/forms.css'
import styles from './StepEditForm.css'
import { FormData, StepType } from '../../form-types'
import { FieldPropsByName, FocusHandlers, StepFormProps } from './types'

const STEP_FORM_MAP: {
  [StepType]: React.ComponentType<StepFormProps> | null | undefined
} = {
  mix: MixForm,
  pause: PauseForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
  thermocycler: ThermocyclerForm,
}

type Props = {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: string | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => mixed
  handleDelete: () => mixed
  handleSave: () => mixed
  showMoreOptionsModal: boolean
  toggleMoreOptionsModal: () => mixed
}

export const StepEditFormComponent = (props: Props): React.Node => {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleDelete,
    dirtyFields,
    handleSave,
    propsForFields,
    showMoreOptionsModal,
    toggleMoreOptionsModal,
    focusedField,
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
        <FormComponent {...{ formData, propsForFields, focusHandlers }} />
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
