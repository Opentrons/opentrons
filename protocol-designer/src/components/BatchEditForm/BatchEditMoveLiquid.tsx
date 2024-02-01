import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  DeprecatedPrimaryButton,
  OutlineButton,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import {
  BlowoutLocationField,
  CheckboxRowField,
  DelayFields,
  FlowRateField,
  TipPositionField,
  WellOrderField,
} from '../StepEditForm/fields'
import { MixFields } from '../StepEditForm/fields/MixFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../StepEditForm/utils'
import { FormColumn } from './FormColumn'
import { FieldPropsByName } from '../StepEditForm/types'
import { WellOrderOption } from '../../form-types'
// TODO(IL, 2021-03-01): refactor these fragmented style rules (see #7402)
import formStyles from '../forms/forms.css'
import styles from '../StepEditForm/StepEditForm.css'
import buttonStyles from '../StepEditForm/ButtonRow/styles.css'

const SourceDestBatchEditMoveLiquidFields = (props: {
  prefix: 'aspirate' | 'dispense'
  propsForFields: FieldPropsByName
}): JSX.Element => {
  const { prefix, propsForFields } = props
  const { t } = useTranslation('form')
  const addFieldNamePrefix = (name: string): string => `${prefix}_${name}`

  const getLabwareIdForPositioningField = (name: string): string | null => {
    const labwareField = getLabwareFieldForPositioningField(name)
    const labwareId = propsForFields[labwareField]?.value
    return labwareId ? String(labwareId) : null
  }

  const getPipetteIdForForm = (): string | null => {
    const pipetteId = propsForFields.pipette?.value
    return pipetteId ? String(pipetteId) : null
  }

  const getWellOrderFieldValue = (
    name: string
  ): WellOrderOption | null | undefined => {
    const val = propsForFields[name]?.value
    if (val === 'l2r' || val === 'r2l' || val === 't2b' || val === 'b2t') {
      return val
    } else {
      return null
    }
  }

  return (
    <FormColumn sectionHeader={t('batch_edit_form.settings_for', { prefix })}>
      <Box className={styles.form_row}>
        <FlowRateField
          {...propsForFields[addFieldNamePrefix('flowRate')]}
          pipetteId={getPipetteIdForForm()}
          flowRateType={prefix}
        />
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('mmFromBottom')]}
          labwareId={getLabwareIdForPositioningField(
            addFieldNamePrefix('mmFromBottom')
          )}
        />
        <WellOrderField
          prefix={prefix}
          label={t('step_edit_form.field.well_order.label')}
          firstValue={getWellOrderFieldValue(
            addFieldNamePrefix('wellOrder_first')
          )}
          secondValue={getWellOrderFieldValue(
            addFieldNamePrefix('wellOrder_second')
          )}
          firstName={addFieldNamePrefix('wellOrder_first')}
          secondName={addFieldNamePrefix('wellOrder_second')}
          updateFirstWellOrder={
            propsForFields[addFieldNamePrefix('wellOrder_first')].updateValue
          }
          updateSecondWellOrder={
            propsForFields[addFieldNamePrefix('wellOrder_second')].updateValue
          }
        />
      </Box>

      {prefix === 'aspirate' && (
        <CheckboxRowField
          {...propsForFields.preWetTip}
          label={t('step_edit_form.field.preWetTip.label')}
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
        labwareId={getLabwareIdForPositioningField(
          addFieldNamePrefix('delay_mmFromBottom')
        )}
        propsForFields={propsForFields}
      />
      <CheckboxRowField
        {...propsForFields[addFieldNamePrefix('touchTip_checkbox')]}
        label={t('step_edit_form.field.touchTip.label')}
        className={styles.small_field}
      >
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('touchTip_mmFromBottom')]}
          labwareId={getLabwareIdForPositioningField(
            addFieldNamePrefix('touchTip_mmFromBottom')
          )}
        />
      </CheckboxRowField>

      {prefix === 'dispense' && (
        <CheckboxRowField
          {...propsForFields.blowout_checkbox}
          label={t('step_edit_form.field.blowout.label')}
          className={styles.small_field}
        >
          <BlowoutLocationField
            {...propsForFields.blowout_location}
            className={styles.full_width}
            options={getBlowoutLocationOptionsForForm({
              path: propsForFields.path.value as any,
              stepType: 'moveLiquid',
            })}
          />
        </CheckboxRowField>
      )}
    </FormColumn>
  )
}

export interface BatchEditMoveLiquidProps {
  batchEditFormHasChanges: boolean
  propsForFields: FieldPropsByName
  handleCancel: () => void
  handleSave: () => void
}
export const BatchEditMoveLiquid = (
  props: BatchEditMoveLiquidProps
): JSX.Element => {
  const { t } = useTranslation(['button', 'tooltip'])
  const { propsForFields, handleCancel, handleSave } = props
  const [cancelButtonTargetProps, cancelButtonTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const [saveButtonTargetProps, saveButtonTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
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

        <Box textAlign="right" maxWidth="55rem" marginTop="3rem">
          <Box
            {...cancelButtonTargetProps}
            marginRight="0.625rem"
            display="inline-block"
          >
            <OutlineButton
              onClick={handleCancel}
              className={buttonStyles.button_auto}
            >
              {t('discard_changes')}
            </OutlineButton>
            <Tooltip {...cancelButtonTooltipProps}>
              {t('tooltip:cancel_batch_edit')}
            </Tooltip>
          </Box>

          <Box
            {...saveButtonTargetProps}
            className={buttonStyles.form_button}
            display="inline-block"
          >
            <DeprecatedPrimaryButton
              disabled={disableSave}
              onClick={handleSave}
            >
              {t('save')}
            </DeprecatedPrimaryButton>
            <Tooltip {...saveButtonTooltipProps}>
              {t(
                `tooltip:save_batch_edit.${
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
