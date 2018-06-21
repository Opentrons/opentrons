// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'

import {
  StepInputField,
  StepCheckboxRow,
  DelayFields,
  PipetteField,
  LabwareDropdown,
  TipSettingsColumn
} from './formFields'

import WellSelectionInput from './WellSelectionInput'
import type {FocusHandlers} from './index'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {focusHandlers: FocusHandlers}

const MixForm = (props: MixFormProps) => {
  const {focusHandlers} = props
  return (
    <React.Fragment>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <LabwareDropdown name="labware" />
        </FormGroup>
        <WellSelectionInput name="wells" labwareFieldName="labware" pipetteFieldName="pipette" {...focusHandlers} />
        <PipetteField name="pipette" />
      </div>

      <div className={cx(formStyles.row_wrapper)}>
        <FormGroup label='Repetitions' className={styles.field_row}>
          <StepInputField name="volume" units='μL' {...focusHandlers} />
          <StepInputField name="times" units='Times' {...focusHandlers} />
        </FormGroup>
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <DelayFields namePrefix="dispense" focusHandlers={focusHandlers} />
            <StepCheckboxRow name="dispense--blowout--checkbox" label='Blow out'>
              <LabwareDropdown name="dispense--blowout--labware" className={styles.full_width} />
            </StepCheckboxRow>
            <StepCheckboxRow name="touch-tip" label='Touch tip' />
          </FormGroup>
        </div>
        <TipSettingsColumn namePrefix="aspirate" />
      </div>
    </React.Fragment>
  )
}

export default MixForm
