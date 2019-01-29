// @flow
import * as React from 'react'
import {FormGroup, HoverTooltip, CheckboxField} from '@opentrons/components'

import i18n from '../../localization'
import type {StepType} from '../../form-types'
import formStyles from '../forms/forms.css'

import {
  TextField,
  CheckboxRowField,
  PipetteField,
  BlowoutLocationField,
  LabwareField,
  ChangeTipField,
  FlowRateField,
  FieldConnector,
  TipPositionField,
  getTooltipForField,
  WellSelectionField,
  WellOrderField,
} from './fields'

import styles from './StepEditForm.css'
import FormSection from './FormSection'
import type {FocusHandlers} from './index'

type TransferLikeFormProps = {focusHandlers: FocusHandlers, stepType: StepType}

const TransferLikeForm = (props: TransferLikeFormProps) => {
  const {focusHandlers, stepType} = props
  return (
    <React.Fragment>
      <FormSection
        sectionName={i18n.t('form.step_edit_form.section.aspirate')}
        headerRow={(
          <div className={formStyles.row_wrapper}>
            <FormGroup label="Labware:" className={styles.labware_field}>
              <LabwareField name="aspirate_labware" {...focusHandlers} />
            </FormGroup>
            <WellSelectionField
              name="aspirate_wells"
              labwareFieldName="aspirate_labware"
              pipetteFieldName="pipette"
              {...focusHandlers} />
            <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
            {stepType === 'consolidate' &&
              <FormGroup label='Volume:' className={styles.volume_field}>
                <TextField name="volume" units='μL' {...focusHandlers} />
              </FormGroup>
            }
          </div>
        )}>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <CheckboxRowField name="aspirate_preWetTip" label="Pre-wet tip" />
              <CheckboxRowField name="aspirate_touchTip" label="Touch tip">
                <TipPositionField fieldName="aspirate_touchTipMmFromBottom" />
              </CheckboxRowField>

              <CheckboxRowField disabled tooltipComponent={i18n.t('tooltip.not_in_beta')} name="aspirate_airGap_checkbox" label="Air Gap">
                <TextField disabled name="aspirate_airGap_volume" units="μL" {...focusHandlers} />
              </CheckboxRowField>

              <CheckboxRowField name="aspirate_mix_checkbox" label='Mix'>
                <TextField name="aspirate_mix_volume" units='μL' {...focusHandlers} />
                <TextField name="aspirate_mix_times" units='Times' {...focusHandlers} />
              </CheckboxRowField>
              {stepType === 'distribute' &&
                <FieldConnector
                  name="aspirate_disposalVol_checkbox"
                  render={({value, updateValue}) => (
                    <React.Fragment>
                      <div className={styles.form_row}>
                        <CheckboxField
                          label="Disposal Volume"
                          value={!!value}
                          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
                        {value
                          ? <div>
                            <TextField name="aspirate_disposalVol_volume" units="μL" {...focusHandlers} />
                          </div>
                          : null}
                      </div>
                      {value
                        ? <div className={styles.form_row}>
                          <div className={styles.sub_select_label}>Blowout</div>
                          <BlowoutLocationField
                            name="dispense_blowout_location"
                            className={styles.full_width}
                            includeSourceWell
                            {...focusHandlers} />
                        </div>
                        : null
                      }
                    </React.Fragment>
                  )} />
              }
            </FormGroup>
          </div>
          <div className={styles.middle_settings_column}>
            <ChangeTipField stepType={stepType} name="aspirate_changeTip" />
            <TipPositionField fieldName="aspirate_mmFromBottom" />
          </div>
          <div className={styles.right_settings_column}>
            {stepType !== 'distribute' && <WellOrderField prefix="aspirate" />}
            <FlowRateField
              name='aspirate_flowRate'
              pipetteFieldName='pipette'
              flowRateType='aspirate' />
          </div>
        </div>
      </FormSection>

      <FormSection
        sectionName={i18n.t('form.step_edit_form.section.dispense')}
        headerRow={(
          <div className={formStyles.row_wrapper}>
            <FormGroup label='Labware:' className={styles.labware_field}>
              <LabwareField name="dispense_labware" {...focusHandlers} />
            </FormGroup>
            <WellSelectionField
              name="dispense_wells"
              labwareFieldName="dispense_labware"
              pipetteFieldName="pipette"
              {...focusHandlers} />
            {(stepType === 'transfer' || stepType === 'distribute') && (
              // TODO: Ian 2018-08-30 make volume field not be a one-off
              <HoverTooltip
                tooltipComponent={getTooltipForField(stepType, 'volume')}
                placement='top-start'>
                {(hoverTooltipHandlers) =>
                  <FormGroup
                    label='Volume:'
                    className={styles.volume_field}
                    hoverTooltipHandlers={hoverTooltipHandlers}>
                    <TextField name="volume" units="μL" {...focusHandlers} />
                  </FormGroup>
                }
              </HoverTooltip>
            )}
          </div>
        )}>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <CheckboxRowField name="dispense_touchTip" label="Touch tip">
                <TipPositionField fieldName="dispense_touchTipMmFromBottom" />
              </CheckboxRowField>
              <CheckboxRowField name="dispense_mix_checkbox" label='Mix'>
                <TextField name="dispense_mix_volume" units="μL" {...focusHandlers} />
                <TextField name="dispense_mix_times" units="Times" {...focusHandlers} />
              </CheckboxRowField>
              {stepType !== 'distribute' &&
                <CheckboxRowField name='dispense_blowout_checkbox' label='Blow out'>
                  <BlowoutLocationField
                    name="dispense_blowout_location"
                    className={styles.full_width}
                    includeSourceWell={stepType === 'transfer'}
                    includeDestWell
                    {...focusHandlers} />
                </CheckboxRowField>
              }
            </FormGroup>
          </div>
          <div className={styles.middle_settings_column}>
            <TipPositionField fieldName="dispense_mmFromBottom" />
          </div>
          <div className={styles.right_settings_column}>
            {stepType !== 'consolidate' && <WellOrderField prefix="dispense" />}
            <FlowRateField
              name='dispense_flowRate'
              pipetteFieldName='pipette'
              flowRateType='dispense'
            />
          </div>
        </div>
      </FormSection>
    </React.Fragment>
  )
}

export default TransferLikeForm
