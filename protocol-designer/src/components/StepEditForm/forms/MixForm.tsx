import { useState } from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../step-forms/selectors'
import { getEnableReturnTip } from '../../../feature-flags/selectors'
import {
  BlowoutLocationField,
  BlowoutZOffsetField,
  ChangeTipField,
  CheckboxRowField,
  Configure96ChannelField,
  DelayFields,
  DropTipField,
  FlowRateField,
  LabwareField,
  PickUpTipField,
  PipetteField,
  TextField,
  TipPositionField,
  TiprackField,
  TipWellSelectionField,
  VolumeField,
  WellOrderField,
  WellSelectionField,
} from '../fields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../utils'
import { AspDispSection } from './AspDispSection'

import type { StepFormProps } from '../types'

import styles from '../StepEditForm.module.css'

export const MixForm = (props: StepFormProps): JSX.Element => {
  const [collapsed, setCollapsed] = useState(true)
  const pipettes = useSelector(getPipetteEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const labwares = useSelector(getLabwareEntities)
  const { t } = useTranslation(['application', 'form'])

  const { propsForFields, formData } = props
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null

  const toggleCollapsed = (): void => {
    setCollapsed(prevCollapsed => !prevCollapsed)
  }
  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{t('stepType.mix')}</span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields.pipette} />
        <TiprackField
          {...propsForFields.tipRack}
          pipetteId={propsForFields.pipette.value}
        />
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
                volume={propsForFields.volume?.value ?? 0}
                tiprack={propsForFields.tipRack.value}
              />
              <TipPositionField
                propsForFields={propsForFields}
                zField="mix_mmFromBottom"
                xField="mix_x_position"
                yField="mix_y_position"
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
                volume={propsForFields.volume?.value ?? 0}
                tiprack={propsForFields.tipRack.value}
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
                  propsForFields={propsForFields}
                  zField="mix_touchTip_mmFromBottom"
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
                <FlowRateField
                  {...propsForFields.blowout_flowRate}
                  pipetteId={formData.pipette}
                  flowRateType="blowout"
                  volume={propsForFields.volume?.value ?? 0}
                  tiprack={propsForFields.tipRack.value}
                />
                <BlowoutZOffsetField
                  {...propsForFields.blowout_z_offset}
                  destLabwareId={propsForFields.labware.value}
                  blowoutLabwareId={propsForFields.blowout_location.value}
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
      </div>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {enableReturnTip
            ? t('form:step_edit_form.section.pickUpAndDrop')
            : t('form:step_edit_form.section.dropTip')}
        </span>
      </div>
      <div className={cx(styles.form_row, styles.section_column)}>
        {enableReturnTip ? (
          <>
            <PickUpTipField {...propsForFields.pickUpTip_location} />
            {userSelectedPickUpTipLocation ? (
              <TipWellSelectionField
                {...propsForFields.pickUpTip_wellNames}
                nozzles={String(propsForFields.nozzles.value) ?? null}
                labwareId={propsForFields.pickUpTip_location.value}
                pipetteId={propsForFields.pipette.value}
              />
            ) : null}
          </>
        ) : null}
        <DropTipField {...propsForFields.dropTip_location} />
        {userSelectedDropTipLocation ? (
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={String(propsForFields.nozzles.value) ?? null}
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        ) : null}
      </div>
    </div>
  )
}
