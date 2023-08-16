import * as React from 'react'
import { i18n } from '../../../../localization'

import {
  BlowoutLocationField,
  CheckboxRowField,
  DelayFields,
  FlowRateField,
  TextField,
  TipPositionField,
  WellOrderField,
} from '../../fields'
import { MixFields } from '../../fields/MixFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
  getTouchTipNotSupportedLabware,
} from '../../utils'
import styles from '../../StepEditForm.css'

import type { FormData } from '../../../../form-types'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { LabwareDefByDefURI } from '../../../../labware-defs'
import type { FieldPropsByName } from '../../types'

interface SourceDestFieldsProps {
  className?: string | null
  prefix: 'aspirate' | 'dispense'
  propsForFields: FieldPropsByName
  formData: FormData
  allLabware: LabwareDefByDefURI
}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestFields = (props: SourceDestFieldsProps): JSX.Element => {
  const { className, formData, prefix, propsForFields, allLabware } = props

  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const getDelayFields = (): JSX.Element => (
    <DelayFields
      checkboxFieldName={addFieldNamePrefix('delay_checkbox')}
      secondsFieldName={addFieldNamePrefix('delay_seconds')}
      tipPositionFieldName={addFieldNamePrefix('delay_mmFromBottom')}
      propsForFields={propsForFields}
      labwareId={
        formData[
          getLabwareFieldForPositioningField(
            addFieldNamePrefix('delay_mmFromBottom')
          )
        ]
      }
    />
  )

  const getMixFields = (): JSX.Element => (
    <MixFields
      checkboxFieldName={addFieldNamePrefix('mix_checkbox')}
      volumeFieldName={addFieldNamePrefix('mix_volume')}
      timesFieldName={addFieldNamePrefix('mix_times')}
      propsForFields={propsForFields}
    />
  )

  return (
    // @ts-expect-error(sa, 2021-7-2): className might be null
    <div className={className}>
      <div className={styles.form_row}>
        <FlowRateField
          {...propsForFields[addFieldNamePrefix('flowRate')]}
          pipetteId={formData.pipette}
          flowRateType={prefix}
        />
        <TipPositionField
          {...propsForFields[addFieldNamePrefix('mmFromBottom')]}
          labwareId={
            formData[
              getLabwareFieldForPositioningField(
                addFieldNamePrefix('mmFromBottom')
              )
            ]
          }
        />
        <WellOrderField
          prefix={prefix}
          label={i18n.t('form.step_edit_form.field.well_order.label')}
          updateFirstWellOrder={
            propsForFields[addFieldNamePrefix('wellOrder_first')].updateValue
          }
          updateSecondWellOrder={
            propsForFields[addFieldNamePrefix('wellOrder_second')].updateValue
          }
          firstValue={formData[addFieldNamePrefix('wellOrder_first')]}
          secondValue={formData[addFieldNamePrefix('wellOrder_second')]}
          firstName={addFieldNamePrefix('wellOrder_first')}
          secondName={addFieldNamePrefix('wellOrder_second')}
        />
      </div>

      <div className={styles.checkbox_column}>
        {prefix === 'aspirate' && (
          <React.Fragment>
            <CheckboxRowField
              {...propsForFields.preWetTip}
              label={i18n.t('form.step_edit_form.field.preWetTip.label')}
              className={styles.small_field}
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
          tooltipContent={
            getTouchTipNotSupportedLabware(
              allLabware,
              formData[
                getLabwareFieldForPositioningField(
                  addFieldNamePrefix('touchTip_mmFromBottom')
                )
              ]
            )
              ? i18n.t('tooltip.step_fields.touchTip.disabled')
              : propsForFields[addFieldNamePrefix('touchTip_checkbox')]
                  .tooltipContent
          }
          label={i18n.t('form.step_edit_form.field.touchTip.label')}
          className={styles.small_field}
          disabled={getTouchTipNotSupportedLabware(
            allLabware,
            formData[
              getLabwareFieldForPositioningField(
                addFieldNamePrefix('touchTip_mmFromBottom')
              )
            ]
          )}
        >
          <TipPositionField
            {...propsForFields[addFieldNamePrefix('touchTip_mmFromBottom')]}
            labwareId={
              formData[
                getLabwareFieldForPositioningField(
                  addFieldNamePrefix('touchTip_mmFromBottom')
                )
              ]
            }
          />
        </CheckboxRowField>

        {prefix === 'dispense' && (
          <CheckboxRowField
            {...propsForFields.blowout_checkbox}
            label={i18n.t('form.step_edit_form.field.blowout.label')}
            className={styles.small_field}
          >
            <BlowoutLocationField
              {...propsForFields.blowout_location}
              className={styles.full_width}
              options={getBlowoutLocationOptionsForForm({
                path: formData.path,
                stepType: formData.stepType,
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
      </div>
    </div>
  )
}
