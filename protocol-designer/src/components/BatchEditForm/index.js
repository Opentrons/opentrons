// @flow
import * as React from 'react'
import { i18n } from '../../localization'
import { CheckboxRowField, TextField } from '../StepEditForm/fields'
import { makeBatchEditFieldProps } from './makeBatchEditFieldProps'
import type {
  DisabledFields,
  MultiselectFieldValues,
} from '../../ui/steps/selectors'
import type { StepType } from '../../form-types'
import type { FieldPropsByName } from '../StepEditForm/types'
import styles from '../StepEditForm/StepEditForm.css'

export type BatchEditFormProps = {|
  disabledFields: DisabledFields | null,
  stepTypes: Array<StepType>,
  fieldValues: MultiselectFieldValues | null,
  handleChangeFormInput: (name: string, value: mixed) => void,
  handleCancel: () => mixed,
  handleSave: () => mixed,
|}

type BatchEditMoveLiquidProps = {|
  propsForFields: FieldPropsByName,
  handleCancel: () => mixed,
  handleSave: () => mixed,
|}
export const BatchEditMoveLiquid = (
  props: BatchEditMoveLiquidProps
): React.Node => {
  const { propsForFields, handleCancel, handleSave } = props
  return (
    // TOOD IMMEDIATELY copied from SourceDestFields. Refactor to be DRY
    <div>
      <CheckboxRowField
        {...propsForFields['aspirate_mix_checkbox']}
        label={i18n.t('form.step_edit_form.field.mix.label')}
        className={styles.small_field}
      >
        <TextField
          {...propsForFields['aspirate_mix_volume']}
          className={styles.small_field}
          units={i18n.t('application.units.microliter')}
        />
        <TextField
          {...propsForFields['aspirate_mix_times']}
          className={styles.small_field}
          units={i18n.t('application.units.times')}
        />
      </CheckboxRowField>
      <p>TODO batch edit form for Transfer step goes here</p>
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={handleSave}>Save</button>
    </div>
  )
}

export const BatchEditForm = (props: BatchEditFormProps): React.Node => {
  const {
    disabledFields,
    stepTypes,
    fieldValues,
    handleChangeFormInput,
    handleCancel,
    handleSave,
  } = props

  if (
    stepTypes.length === 1 &&
    stepTypes.includes('moveLiquid') &&
    fieldValues !== null &&
    disabledFields !== null
  ) {
    // Valid state for using makeBatchEditFieldProps
    const propsForFields = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput
    )
    return (
      <BatchEditMoveLiquid {...{ propsForFields, handleCancel, handleSave }} />
    )
  }

  return null
}
