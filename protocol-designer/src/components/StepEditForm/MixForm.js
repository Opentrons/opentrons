// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup, InputField} from '@opentrons/components'

import {
  CheckboxRow,
  DelayFields,
  PipetteField,
  LabwareDropdown,
  TipSettingsColumn
} from './formFields'
import StepField from './StepFormField'
import type {MixForm as MixFormData} from '../../form-types'
import type {FormConnector} from '../../utils'
import WellSelectionInput from '../../containers/WellSelectionInput'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {formData: MixFormData, formConnector: FormConnector<*>}

const MixForm = (props: MixFormProps) => {
  const {dirtyFields, focusedField, onFieldFocus, onFieldBlur} = props
  return (
    <React.Fragment>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <LabwareDropdown name="labware" />
        </FormGroup>
        {/* TODO LATER: also 'disable' when selected labware is a trash */}
        <WellSelectionInput
          labwareFieldName="labware"
          pipetteFieldName="pipette"
          initialSelectedWells={formData['wells']}
          name="wells"
        />
        <PipetteField name="pipette" />
      </div>

      <div className={cx(formStyles.row_wrapper)}>
        <FormGroup label='Repetitions' className={styles.field_row}>
          <StepField
            name="volume"
            focusedField={focusedField}
            dirtyFields={dirtyFields}
            render={({value, updateValue}) => (
              <InputField units='uL' onChange={updateValue} value={value} />
            )} />
          <StepField
            name="times"
            focusedField={focusedField}
            dirtyFields={dirtyFields}
            render={({value, updateValue}) => (
              <InputField units='Times' onChange={updateValue} value={value} />
            )} />
        </FormGroup>
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <DelayFields
              namePrefix="dispense"
              focusedField={focusedField}
              dirtyFields={dirtyFields} />
            <CheckboxRow name="dispense--blowout--checkbox" label='Blow out'>
              <LabwareDropdown name="dispense--blowout--labware" className={styles.full_width} />
            </CheckboxRow>
            <CheckboxRow name="touch-tip" label='Touch tip' />
          </FormGroup>
        </div>
        <TipSettingsColumn namePrefix="aspirate" />
      </div>
    </React.Fragment>
  )
}

export default MixForm
