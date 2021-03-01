// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  PrimaryButton,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { CheckboxRowField, TextField } from '../StepEditForm/fields'
import { makeBatchEditFieldProps } from './makeBatchEditFieldProps'
import {
  getBatchEditSelectedStepTypes,
  getMultiSelectDisabledFields,
  getMultiSelectFieldValues,
  getMultiSelectItemIds,
} from '../../ui/steps/selectors'
import { getBatchEditFormHasUnsavedChanges } from '../../step-forms/selectors'
import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'
import type { FieldPropsByName } from '../StepEditForm/types'
// TODO(IL, 2021-03-01): refactor these fragmented style rules (see #7402)
import formStyles from '../forms/forms.css'
import styles from '../StepEditForm/StepEditForm.css'
import buttonStyles from '../StepEditForm/ButtonRow/styles.css'

export type BatchEditFormProps = {||}

type BatchEditMoveLiquidProps = {|
  batchEditFormHasChanges: boolean,
  propsForFields: FieldPropsByName,
  handleCancel: () => mixed,
  handleSave: () => mixed,
|}
export const BatchEditMoveLiquid = (
  props: BatchEditMoveLiquidProps
): React.Node => {
  const { propsForFields, handleCancel, handleSave } = props
  const [saveButtonTargetProps, saveButtonTooltipProps] = useHoverTooltip()
  const disableSave = !props.batchEditFormHasChanges

  return (
    <div className={formStyles.form}>
      {/* TODO IMMEDIATELY copied from SourceDestFields. Refactor to be DRY */}
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

      <Box textAlign="right" maxWidth="55rem">
        <PrimaryButton
          className={buttonStyles.form_button}
          onClick={handleCancel}
        >
          {i18n.t('button.cancel')}
        </PrimaryButton>
        <Box
          {...saveButtonTargetProps}
          className={buttonStyles.form_button}
          display="inline-block"
        >
          <PrimaryButton disabled={disableSave} onClick={handleSave}>
            {i18n.t('button.save')}
          </PrimaryButton>
          <Tooltip {...saveButtonTooltipProps}>
            {i18n.t(
              `tooltip.save_batch_edit.${disableSave ? 'disabled' : 'enabled'}`
            )}
          </Tooltip>
        </Box>
      </Box>
    </div>
  )
}

export const BatchEditForm = (props: BatchEditFormProps): React.Node => {
  const dispatch = useDispatch()
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const batchEditFormHasChanges = useSelector(getBatchEditFormHasUnsavedChanges)

  const handleChangeFormInput = (name, value) => {
    dispatch(changeBatchEditField({ [name]: value }))
  }

  const handleSave = () => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleCancel = () => dispatch(resetBatchEditFieldChanges())

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
      <BatchEditMoveLiquid
        {...{
          propsForFields,
          handleCancel,
          handleSave,
          batchEditFormHasChanges,
        }}
      />
    )
  }

  return null
}
