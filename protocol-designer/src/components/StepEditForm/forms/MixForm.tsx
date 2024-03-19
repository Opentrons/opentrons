import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { getPipetteEntities } from '../../../step-forms/selectors'
import {
  BlowoutLocationField,
  ChangeTipField,
  CheckboxRowField,
  DelayFields,
  FlowRateField,
  LabwareField,
  PipetteField,
  TextField,
  TipPositionField,
  VolumeField,
  WellOrderField,
  WellSelectionField,
} from '../fields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../utils'
import { Configure96ChannelField } from '../fields/Configure96ChannelField'
import { DropTipField } from '../fields/DropTipField'
import { AspDispSection } from './AspDispSection'

import type { StepFormProps } from '../types'

import styles from '../StepEditForm.module.css'

export const MixForm = (props: StepFormProps): JSX.Element => {
  const [collapsed, setCollapsed] = React.useState(true)
  const pipettes = useSelector(getPipetteEntities)
  const { t } = useTranslation(['application', 'form'])

  const { propsForFields, formData } = props
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'

  const toggleCollapsed = (): void =>
    setCollapsed(prevCollapsed => !prevCollapsed)

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{t('stepType.mix')}</span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields.pipette} />
        {is96Channel ? (
          <Configure96ChannelField {...propsForFields.nozzles} />
        ) : null}
        <VolumeField
          {...propsForFields.volume}
          label={t('form:step_edit_form.mixVolumeLabel')}
          stepType="mix"
          className={styles.small_field}
        />
        <FormGroup
          className={styles.small_field}
          label={t('form:step_edit_form.mixRepetitions')}
        >
          <TextField {...propsForFields.times} units={t('units.times')} />
        </FormGroup>
      </div>
      <div className={styles.form_row}>
        <FormGroup
          label={t('form:step_edit_form.labwareLabel.mixLabware')}
          className={styles.large_field}
        >
          <LabwareField {...propsForFields.labware} />
        </FormGroup>
        <WellSelectionField
          {...propsForFields.wells}
          labwareId={formData.labware}
          pipetteId={formData.pipette}
          nozzles={
            propsForFields.nozzles?.value != null
              ? String(propsForFields.nozzles.value)
              : null
          }
        />
      </div>
      <div className={styles.section_divider} />

      <div className={styles.section_wrapper}>
        <AspDispSection
          className={styles.section_column}
          prefix="aspirate"
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
        />
        <AspDispSection
          className={styles.section_column}
          prefix="dispense"
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
        />
      </div>

      {!collapsed && (
        <div
          className={cx(styles.section_wrapper, styles.advanced_settings_panel)}
        >
          <div className={styles.section_column}>
            <div className={styles.form_row}>
              <FlowRateField
                {...propsForFields.aspirate_flowRate}
                pipetteId={formData.pipette}
                flowRateType="aspirate"
              />
              <TipPositionField
                {...propsForFields.mix_mmFromBottom}
                labwareId={
                  formData[
                    getLabwareFieldForPositioningField('mix_mmFromBottom')
                  ]
                }
              />
              <WellOrderField
                updateFirstWellOrder={
                  propsForFields.mix_wellOrder_first.updateValue
                }
                updateSecondWellOrder={
                  propsForFields.mix_wellOrder_second.updateValue
                }
                prefix="mix"
                label={t('form:step_edit_form.field.well_order.label')}
                firstValue={formData.mix_wellOrder_first}
                secondValue={formData.mix_wellOrder_second}
                firstName={'mix_wellOrder_first'}
                secondName={'mix_wellOrder_second'}
              />
            </div>
            <DelayFields
              checkboxFieldName={'aspirate_delay_checkbox'}
              secondsFieldName={'aspirate_delay_seconds'}
              labwareId={
                formData[
                  getLabwareFieldForPositioningField(
                    'aspirate_delay_mmFromBottom'
                  )
                ]
              }
              propsForFields={propsForFields}
            />
          </div>

          <div className={styles.section_column}>
            <div className={styles.form_row}>
              <FlowRateField
                {...propsForFields.dispense_flowRate}
                pipetteId={formData.pipette}
                flowRateType="dispense"
              />
            </div>
            <div className={styles.checkbox_column}>
              <DelayFields
                checkboxFieldName={'dispense_delay_checkbox'}
                secondsFieldName={'dispense_delay_seconds'}
                propsForFields={propsForFields}
                labwareId={
                  formData[
                    getLabwareFieldForPositioningField(
                      'aspirate_delay_mmFromBottom'
                    )
                  ]
                }
              />
              <CheckboxRowField
                {...propsForFields.mix_touchTip_checkbox}
                className={styles.small_field}
                label={t('form:step_edit_form.field.touchTip.label')}
              >
                <TipPositionField
                  {...propsForFields.mix_touchTip_mmFromBottom}
                  labwareId={
                    formData[
                      getLabwareFieldForPositioningField(
                        'mix_touchTip_mmFromBottom'
                      )
                    ]
                  }
                />
              </CheckboxRowField>

              <CheckboxRowField
                {...propsForFields.blowout_checkbox}
                className={styles.small_field}
                label={t('form:step_edit_form.field.blowout.label')}
              >
                <BlowoutLocationField
                  {...propsForFields.blowout_location}
                  className={styles.full_width}
                  options={getBlowoutLocationOptionsForForm({
                    stepType: formData.stepType,
                  })}
                />
              </CheckboxRowField>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section_header}>
        <span className={styles.section_header_text_column}>
          {t('form:step_edit_form.section.sterility')}
        </span>
        <span className={styles.section_header_text_column}>
          {t('form:step_edit_form.section.dropTip')}
        </span>
      </div>
      <div className={styles.section_wrapper}>
        <div className={styles.form_row}>
          <ChangeTipField
            {...propsForFields.changeTip}
            aspirateWells={formData.aspirate_wells}
            dispenseWells={formData.dispense_wells}
            path={formData.path}
            stepType={formData.stepType}
          />
        </div>
        <div className={cx(styles.form_row, styles.section_column)}>
          <DropTipField {...propsForFields.dropTip_location} />
        </div>
      </div>
    </div>
  )
}
