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
  CheckboxRowField,
  // DelayFields,
  TipPositionField,
  MixFields,
  TextField,
} from '../StepEditForm/fields'
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

  const getCommonLabwareId = (
    propsForFields: FieldPropsByName
  ): string | null => {
    // TODO IMMEDIATELY: is getting labware field for asp vs dest prefix already a util somewhere??
    const labwareField =
      prefix === 'aspirate' ? 'aspirate_labware' : 'dispense_labware'

    const labwareId = propsForFields[labwareField]?.value
    return labwareId ? String(labwareId) : null
  }
  const commonLabwareId = getCommonLabwareId(propsForFields)

  return (
    <Box>
      <div>TODO settings for {prefix}</div>
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
      {/* TODO(IL, 2021-03-03): DelayFields uses TipPositionField, which needs FormData 
        and we don't actually have that. Need to refactor TipPositionField and its consumers. 
        BUT according to the design, we want to IGNORE the tip position for Delay + Touch Tip! */}
      {/* <DelayFields
          checkboxFieldName={addFieldNamePrefix("delay_checkbox")}
          secondsFieldName={addFieldNamePrefix("delay_seconds")}
          propsForFields={propsForFields}
        /> */}

      <CheckboxRowField
        {...propsForFields[addFieldNamePrefix('touchTip_checkbox')]}
        label={i18n.t('form.step_edit_form.field.touchTip.label')}
        className={styles.small_field}
      >
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('touchTip_mmFromBottom')]}
          labwareId={commonLabwareId}
        />
      </CheckboxRowField>

      {prefix === 'dispense' && (
        <CheckboxRowField
          {...propsForFields['blowout_checkbox']}
          label={i18n.t('form.step_edit_form.field.blowout.label')}
          className={styles.small_field}
        >
          {/* TODO(IL, 2021-03-03): needs formData. Location is supported only with same-pipette, right? */}
          {/* <BlowoutLocationField
              {...propsForFields['blowout_location']}
              className={styles.full_width}
              formData={formData}
            /> */}
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
      <SourceDestBatchEditMoveLiquidFields
        prefix="aspirate"
        propsForFields={propsForFields}
      />
      <SourceDestBatchEditMoveLiquidFields
        prefix="dispense"
        propsForFields={propsForFields}
      />

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
