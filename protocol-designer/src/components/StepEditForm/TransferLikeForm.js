// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'

import {
  StepInputField,
  StepCheckboxRow,
  DispenseDelayFields,
  PipetteField,
  LabwareDropdown,
  ChangeTipField,
  FlowRateField,
  TipPositionField
} from './formFields'

import WellSelectionInput from './WellSelectionInput'
import type {StepType} from '../../form-types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import FormSection from './FormSection'
import type {FocusHandlers} from './index'

type TransferLikeFormProps = {focusHandlers: FocusHandlers, stepType: StepType}

const TransferLikeForm = (props: TransferLikeFormProps) => {
  const {focusHandlers, stepType} = props
  return (
    <React.Fragment>
      <FormSection sectionName="aspirate">
        <div className={formStyles.row_wrapper}>
          <FormGroup label="Labware:" className={styles.labware_field}>
            <LabwareDropdown name="aspirate--labware" />
          </FormGroup>
          {/* TODO LATER: also 'disable' when selected labware is a trash */}
          <WellSelectionInput
            name="aspirate--wells"
            labwareFieldName="aspirate--labware"
            pipetteFieldName="pipette"
            {...focusHandlers} />
          <PipetteField name="pipette" />
          {stepType === 'consolidate' &&
            <FormGroup label='Volume:' className={styles.volume_field}>
              <StepInputField name="volume" units='μL' {...focusHandlers} />
            </FormGroup>}
        </div>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <StepCheckboxRow name="aspirate--pre-wet-tip" label="Pre-wet tip" />
              <StepCheckboxRow name="aspirate--touch-tip" label="Touch tip" />
              <StepCheckboxRow name="aspirate--air-gap--checkbox" label="Air Gap">
                <StepInputField name="aspirate--air-gap--volume" units="μL" {...focusHandlers} />
              </StepCheckboxRow>
              <StepCheckboxRow name="aspirate--mix--checkbox" label='Mix'>
                <StepInputField name="aspirate--mix--volume" units='μL' {...focusHandlers} />
                <StepInputField name="aspirate--mix--times" units='Times' {...focusHandlers} />
              </StepCheckboxRow>
              <StepCheckboxRow name="aspirate--disposal-vol--checkbox" label="Disposal Volume" >
                <StepInputField name="aspirate--disposal-vol--volume" units="μL" {...focusHandlers} />
              </StepCheckboxRow>
            </FormGroup>
          </div>
          <div className={styles.right_settings_column}>
            <ChangeTipField name="aspirate--change-tip" />
            <FlowRateField />
            <TipPositionField />
          </div>
        </div>
      </FormSection>

      <FormSection sectionName='dispense'>
        <div className={formStyles.row_wrapper}>
          <FormGroup label='Labware:' className={styles.labware_field}>
            <LabwareDropdown name="dispense--labware" />
          </FormGroup>
          <WellSelectionInput
            name="dispense--wells"
            labwareFieldName="dispense--labware"
            pipetteFieldName="pipette"
            {...focusHandlers} />
          {(stepType === 'transfer' || stepType === 'distribute') &&
            <FormGroup label='Volume:' className={styles.volume_field}>
              <StepInputField name="volume" units="μL" {...focusHandlers} />
            </FormGroup>}
        </div>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <StepCheckboxRow name="dispense--mix--checkbox" label='Mix'>
                <StepInputField name="dispense--mix--volume" units="μL" {...focusHandlers} />
                <StepInputField name="dispense--mix--times" units="Times" {...focusHandlers} />
              </StepCheckboxRow>
              <DispenseDelayFields focusHandlers={focusHandlers} />
              <StepCheckboxRow name='dispense--blowout--checkbox' label='Blow out' >
                <LabwareDropdown name="dispense--blowout--labware" className={styles.full_width} />
              </StepCheckboxRow>
            </FormGroup>
          </div>
          <div className={styles.right_settings_column}>
            <FlowRateField />
            <TipPositionField />
          </div>
        </div>
      </FormSection>
    </React.Fragment>
  )
}

export default TransferLikeForm
