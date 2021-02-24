// @flow
import * as React from 'react'
import cx from 'classnames'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import {
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  PipetteField,
  VolumeField,
  LabwareField,
  ChangeTipField,
  FlowRateField,
  WellSelectionField,
  TipPositionField,
  WellOrderField,
  DelayFields,
} from '../fields'
import { AspDispSection } from './AspDispSection'

import type { StepFormProps } from '../types'

import styles from '../StepEditForm.css'

export const MixForm = (props: StepFormProps): React.Node => {
  const [collapsed, setCollapsed] = React.useState(true)

  const { propsForFields, formData } = props

  const toggleCollapsed = (): void =>
    setCollapsed(prevCollapsed => !prevCollapsed)

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.mix')}
        </span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields['pipette']} />
        <VolumeField
          {...propsForFields['volume']}
          label={i18n.t('form.step_edit_form.mixVolumeLabel')}
          stepType="mix"
          className={styles.small_field}
        />
        <FormGroup
          className={styles.small_field}
          label={i18n.t('form.step_edit_form.mixRepetitions')}
        >
          <TextField
            {...propsForFields['times']}
            units={i18n.t('application.units.times')}
          />
        </FormGroup>
      </div>
      <div className={styles.form_row}>
        <FormGroup
          label={i18n.t('form.step_edit_form.labwareLabel.mixLabware')}
          className={styles.large_field}
        >
          <LabwareField {...propsForFields['labware']} />
        </FormGroup>
        <WellSelectionField
          {...propsForFields['wells']}
          labwareFieldName="labware"
          pipetteFieldName="pipette"
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
                {...propsForFields['aspirate_flowRate']}
                pipetteFieldName="pipette"
                flowRateType="aspirate"
                formData={props.formData}
              />
              <TipPositionField
                {...propsForFields['mix_mmFromBottom']}
                formData={formData}
              />
              <WellOrderField
                updateFirstWellOrder={
                  propsForFields['mix_wellOrder_first'].updateValue
                }
                updateSecondWellOrder={
                  propsForFields['mix_wellOrder_second'].updateValue
                }
                prefix="mix"
                label={i18n.t('form.step_edit_form.field.well_order.label')}
                formData={props.formData}
              />
            </div>
            <DelayFields
              checkboxFieldName={'aspirate_delay_checkbox'}
              secondsFieldName={'aspirate_delay_seconds'}
              propsForFields={propsForFields}
              formData={formData}
            />
          </div>

          <div className={styles.section_column}>
            <div className={styles.form_row}>
              <FlowRateField
                {...propsForFields['dispense_flowRate']}
                pipetteFieldName="pipette"
                flowRateType="dispense"
                formData={props.formData}
              />
            </div>
            <div className={styles.checkbox_column}>
              <DelayFields
                checkboxFieldName={'dispense_delay_checkbox'}
                secondsFieldName={'dispense_delay_seconds'}
                propsForFields={propsForFields}
                formData={formData}
              />
              <CheckboxRowField
                {...propsForFields['mix_touchTip_checkbox']}
                className={styles.small_field}
                label={i18n.t('form.step_edit_form.field.touchTip.label')}
                tooltipContent={i18n.t(
                  'tooltip.step_fields.defaults.mix_touchTip_checkbox'
                )}
              >
                <TipPositionField
                  {...propsForFields['mix_touchTip_mmFromBottom']}
                  formData={formData}
                />
              </CheckboxRowField>

              <CheckboxRowField
                {...propsForFields['blowout_checkbox']}
                className={styles.small_field}
                label={i18n.t('form.step_edit_form.field.blowout.label')}
                tooltipContent={i18n.t(
                  'tooltip.step_fields.defaults.blowout_checkbox'
                )}
              >
                <BlowoutLocationField
                  {...propsForFields['blowout_location']}
                  className={styles.full_width}
                  formData={formData}
                />
              </CheckboxRowField>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('form.step_edit_form.section.sterility')}
        </span>
      </div>
      <div className={styles.section_wrapper}>
        <div className={styles.form_row}>
          <ChangeTipField
            {...propsForFields['changeTip']}
            aspirateWells={formData.aspirate_wells}
            dispenseWells={formData.dispense_wells}
            path={formData.path}
            stepType={formData.stepType}
          />
        </div>
      </div>
    </div>
  )
}
