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

interface BatchEditMixProps {
  batchEditFormHasChanges: boolean
  propsForFields: FieldPropsByName
  handleCancel: () => unknown
  handleSave: () => unknown
}
export const BatchEditMix = (props: BatchEditMixProps): JSX.Element => {
  const { propsForFields, handleCancel, handleSave } = props
  const { t } = useTranslation(['form', 'button', 'tooltip'])
  const [cancelButtonTargetProps, cancelButtonTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const [saveButtonTargetProps, saveButtonTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const disableSave = !props.batchEditFormHasChanges

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
    <div className={formStyles.form}>
      <Box className={styles.form_wrapper}>
        <Box className={styles.section_wrapper}>
          <FormColumn
            sectionHeader={t('batch_edit_form.settings_for', {
              prefix: 'aspirate',
            })}
          >
            <Box className={styles.form_row}>
              <FlowRateField
                {...propsForFields.aspirate_flowRate}
                pipetteId={getPipetteIdForForm()}
                flowRateType="aspirate"
              />
              <TipPositionField
                {...propsForFields.mix_mmFromBottom}
                labwareId={getLabwareIdForPositioningField('mix_mmFromBottom')}
              />
              <WellOrderField
                prefix="mix"
                label={t('step_edit_form.field.well_order.label')}
                firstValue={getWellOrderFieldValue('mix_wellOrder_first')}
                secondValue={getWellOrderFieldValue('mix_wellOrder_second')}
                firstName="mix_wellOrder_first"
                secondName="mix_wellOrder_second"
                updateFirstWellOrder={
                  propsForFields.mix_wellOrder_first.updateValue
                }
                updateSecondWellOrder={
                  propsForFields.mix_wellOrder_second.updateValue
                }
              />
            </Box>

            <DelayFields
              checkboxFieldName={'aspirate_delay_checkbox'}
              secondsFieldName={'aspirate_delay_seconds'}
              labwareId={getLabwareIdForPositioningField(
                'aspirate_delay_mmFromBottom'
              )}
              propsForFields={propsForFields}
            />
          </FormColumn>

          <FormColumn
            sectionHeader={t('batch_edit_form.settings_for', {
              prefix: 'dispense',
            })}
          >
            <Box className={styles.form_row}>
              <FlowRateField
                {...propsForFields.dispense_flowRate}
                pipetteId={getPipetteIdForForm()}
                flowRateType="dispense"
              />
            </Box>
            <DelayFields
              checkboxFieldName={'dispense_delay_checkbox'}
              secondsFieldName={'dispense_delay_seconds'}
              labwareId={getLabwareIdForPositioningField(
                'dispense_delay_mmFromBottom'
              )}
              propsForFields={propsForFields}
            />
            <CheckboxRowField
              {...propsForFields.mix_touchTip_checkbox}
              label={t('step_edit_form.field.touchTip.label')}
              className={styles.small_field}
            >
              <TipPositionField
                {...propsForFields.mix_touchTip_mmFromBottom}
                labwareId={getLabwareIdForPositioningField(
                  'mix_touchTip_mmFromBottom'
                )}
              />
            </CheckboxRowField>
            <CheckboxRowField
              {...propsForFields.blowout_checkbox}
              label={t('step_edit_form.field.blowout.label')}
              className={styles.small_field}
            >
              <BlowoutLocationField
                {...propsForFields.blowout_location}
                className={styles.full_width}
                options={getBlowoutLocationOptionsForForm({
                  stepType: 'mix',
                })}
              />
            </CheckboxRowField>
          </FormColumn>
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
              {t('button:discard_changes')}
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
              {t('button:save')}
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
