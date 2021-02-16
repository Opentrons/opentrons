// @flow
import * as React from 'react'
import { i18n } from '../../../../localization'

import {
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  TipPositionField,
  FlowRateField,
  WellOrderField,
  DelayFields,
} from '../../fields'

import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FieldPropsByName } from '../../types'
import type { FormData } from '../../../../form-types'
import styles from '../../StepEditForm.css'

type Props = {|
  className?: ?string,
  formData: FormData,
  prefix: 'aspirate' | 'dispense',
  propsForFields: FieldPropsByName,
|}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestFields = (props: Props): React.Node => {
  const { className, formData, prefix, propsForFields } = props

  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)

  const getMixFields = () => (
    <CheckboxRowField
      {...propsForFields[addFieldNamePrefix('mix_checkbox')]}
      label={i18n.t('form.step_edit_form.field.mix.label')}
      className={styles.small_field}
      tooltipContent={i18n.t(
        `tooltip.step_fields.defaults.${addFieldNamePrefix('mix_checkbox')}`
      )}
    >
      <TextField
        {...propsForFields[addFieldNamePrefix('mix_volume')]}
        className={styles.small_field}
        units={i18n.t('application.units.microliter')}
      />
      <TextField
        {...propsForFields[addFieldNamePrefix('mix_times')]}
        className={styles.small_field}
        units={i18n.t('application.units.times')}
      />
    </CheckboxRowField>
  )

  const getDelayFields = () => (
    <DelayFields
      checkboxFieldName={addFieldNamePrefix('delay_checkbox')}
      secondsFieldName={addFieldNamePrefix('delay_seconds')}
      tipPositionFieldName={addFieldNamePrefix('delay_mmFromBottom')}
      propsForFields={propsForFields}
      formData={formData}
    />
  )

  return (
    <div className={className}>
      <div className={styles.form_row}>
        <FlowRateField
          name={addFieldNamePrefix('flowRate')}
          pipetteFieldName="pipette"
          flowRateType={prefix}
        />
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('mmFromBottom')]}
          formData={formData}
        />
        <WellOrderField
          prefix={prefix}
          label={i18n.t('form.step_edit_form.field.well_order.label')}
        />
      </div>

      <div className={styles.checkbox_column}>
        {prefix === 'aspirate' && (
          <React.Fragment>
            <CheckboxRowField
              {...propsForFields['preWetTip']}
              label={i18n.t('form.step_edit_form.field.preWetTip.label')}
              className={styles.small_field}
              tooltipContent={i18n.t(`tooltip.step_fields.defaults.preWetTip`)}
            />
            {getMixFields()}
            {getDelayFields()}
          </React.Fragment>
        )}
        {prefix === 'dispense' && (
          <React.Fragment>
            {getDelayFields()}
            {getMixFields()}
          </React.Fragment>
        )}
        <CheckboxRowField
          {...propsForFields[addFieldNamePrefix('touchTip_checkbox')]}
          tooltipContent={i18n.t(
            `tooltip.step_fields.defaults.${addFieldNamePrefix(
              'touchTip_checkbox'
            )}`
          )}
          label={i18n.t('form.step_edit_form.field.touchTip.label')}
          className={styles.small_field}
        >
          <TipPositionField
            {...propsForFields[addFieldNamePrefix('touchTip_mmFromBottom')]}
            formData={formData}
          />
        </CheckboxRowField>

        {prefix === 'dispense' && (
          <CheckboxRowField
            {...propsForFields['blowout_checkbox']}
            label={i18n.t('form.step_edit_form.field.blowout.label')}
            className={styles.small_field}
            tooltipContent={i18n.t(
              `tooltip.step_fields.defaults.blowout_checkbox`
            )}
          >
            <BlowoutLocationField
              {...propsForFields['blowout_location']}
              className={styles.full_width}
            />
          </CheckboxRowField>
        )}
        <CheckboxRowField
          {...propsForFields[addFieldNamePrefix('airGap_checkbox')]}
          tooltipContent={i18n.t(
            `tooltip.step_fields.defaults.${addFieldNamePrefix(
              'airGap_checkbox'
            )}`
          )}
          label={i18n.t('form.step_edit_form.field.airGap.label')}
          className={styles.small_field}
        >
          <TextField
            {...propsForFields[addFieldNamePrefix('airGap_volume')]}
            className={styles.small_field}
            units={i18n.t('application.units.microliter')}
          />
        </CheckboxRowField>
      </div>
    </div>
  )
}
