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
import {
  BlowoutLocationField,
  CheckboxRowField,
  DelayFields,
  TipPositionField,
  TextField,
} from '../StepEditForm/fields'
import { MixFields } from '../StepEditForm/fields/MixFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../StepEditForm/utils'
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

const SourceDestBatchEditMoveLiquidFields = (props: {|
  prefix: 'aspirate' | 'dispense',
  propsForFields: FieldPropsByName,
|}): React.Node => {
  const { prefix, propsForFields } = props
  const addFieldNamePrefix = name => `${prefix}_${name}`

  const getLabwareIdForField = (name: string): string | null => {
    const labwareField = getLabwareFieldForPositioningField(name)
    const labwareId = propsForFields[labwareField]?.value
    return labwareId ? String(labwareId) : null
  }

  return (
    <Box className={styles.section_column}>
      <Box className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('form.batch_edit_form.settings_for', { prefix })}
        </span>
      </Box>
      {prefix === 'aspirate' && (
        <CheckboxRowField
          {...propsForFields['preWetTip']}
          label={i18n.t('form.step_edit_form.field.preWetTip.label')}
          className={styles.small_field}
        />
      )}
      <MixFields
        checkboxFieldName={addFieldNamePrefix('mix_checkbox')}
        volumeFieldName={addFieldNamePrefix('mix_volume')}
        timesFieldName={addFieldNamePrefix('mix_times')}
        propsForFields={propsForFields}
      />
      <DelayFields
        checkboxFieldName={addFieldNamePrefix('delay_checkbox')}
        secondsFieldName={addFieldNamePrefix('delay_seconds')}
        tipPositionFieldName={addFieldNamePrefix('delay_mmFromBottom')}
        labwareId={getLabwareIdForField(
          addFieldNamePrefix('delay_mmFromBottom')
        )}
        propsForFields={propsForFields}
      />
      <CheckboxRowField
        {...propsForFields[addFieldNamePrefix('touchTip_checkbox')]}
        label={i18n.t('form.step_edit_form.field.touchTip.label')}
        className={styles.small_field}
      >
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('touchTip_mmFromBottom')]}
          labwareId={getLabwareIdForField(
            addFieldNamePrefix('touchTip_mmFromBottom')
          )}
        />
      </CheckboxRowField>

      {prefix === 'dispense' && (
        <CheckboxRowField
          {...propsForFields['blowout_checkbox']}
          label={i18n.t('form.step_edit_form.field.blowout.label')}
          className={styles.small_field}
        >
          {/* TODO(IL, 2021-03-03): Location is supported only with same-pipette, right? Which options? */}
          <BlowoutLocationField
            {...propsForFields['blowout_location']}
            className={styles.full_width}
            options={getBlowoutLocationOptionsForForm({
              path: (propsForFields['path'].value: any),
              stepType: 'moveLiquid',
            })}
          />
        </CheckboxRowField>
      )}
      <CheckboxRowField
        {...propsForFields[addFieldNamePrefix('airGap_checkbox')]}
        label={i18n.t('form.step_edit_form.field.airGap.label')}
        className={styles.small_field}
      >
        <TextField
          {...propsForFields[addFieldNamePrefix('airGap_volume')]}
          className={styles.small_field}
          units={i18n.t('application.units.microliter')}
        />
      </CheckboxRowField>
    </Box>
  )
}

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
  const [cancelButtonTargetProps, cancelButtonTooltipProps] = useHoverTooltip()
  const [saveButtonTargetProps, saveButtonTooltipProps] = useHoverTooltip()
  const disableSave = !props.batchEditFormHasChanges

  return (
    <div className={formStyles.form}>
      <Box className={styles.form_wrapper}>
        <Box className={styles.section_wrapper}>
          <SourceDestBatchEditMoveLiquidFields
            prefix="aspirate"
            propsForFields={propsForFields}
          />
          <SourceDestBatchEditMoveLiquidFields
            prefix="dispense"
            propsForFields={propsForFields}
          />
        </Box>

        <Box textAlign="right" maxWidth="55rem">
          <Box
            {...cancelButtonTargetProps}
            className={buttonStyles.form_button}
            display="inline-block"
          >
            <PrimaryButton
              className={buttonStyles.form_button}
              onClick={handleCancel}
            >
              {i18n.t('button.cancel')}
            </PrimaryButton>
            <Tooltip {...cancelButtonTooltipProps}>
              {i18n.t('tooltip.cancel_batch_edit')}
            </Tooltip>
          </Box>

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
                `tooltip.save_batch_edit.${
                  disableSave ? 'disabled' : 'enabled'
                }`
              )}
            </Tooltip>
          </Box>
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
