  // @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup, InputField} from '@opentrons/components'

import {
  CheckboxRow,
  DelayField,
  ConnectedPipetteField,
  ConnectedLabwareOptionsDropdown,
  TipSettingsColumn
} from './formFields'
import type {FormData} from '../../form-types'
import WellSelectionInput from '../../containers/WellSelectionInput'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {formData: FormData}

const MixForm = ({formData, formConnector}: MixFormProps) => (
  <React.Fragment>
    <div className={formStyles.row_wrapper}>
      <FormGroup label='Labware:' className={styles.labware_field}>
        <ConnectedLabwareOptionsDropdown {...formConnector('labware')} />
      </FormGroup>
      {/* TODO LATER: also 'disable' when selected labware is a trash */}
      <WellSelectionInput
        className={styles.well_selection_input}
        labwareId={formData['labware']}
        pipetteId={formData['pipette']}
        initialSelectedWells={formData['wells']}
        formFieldAccessor={'wells'}
      />
      <ConnectedPipetteField formConnector={formConnector}/>
    </div>

    <div className={cx(formStyles.row_wrapper)}>
      <FormGroup label='Repetitions' className={styles.field_row}>
        <InputField units='uL' {...formConnector('volume')} />
        <InputField units='Times' {...formConnector('times')} />
      </FormGroup>
    </div>

    <div className={formStyles.row_wrapper}>
      <div className={styles.left_settings_column}>
        <FormGroup label='TECHNIQUE'>
          <DelayField
            checkboxAccessor='dispense--delay--checkbox'
            formConnector={formConnector}
            minutesAccessor='dispense--delay-minutes'
            secondsAccessor='dispense--delay-seconds'
          />
          <CheckboxRow
            checkboxAccessor='dispense--blowout--checkbox'
            formConnector={formConnector}
            label='Blow out'
          >
            <ConnectedLabwareOptionsDropdown
              className={styles.full_width}
              {...formConnector('dispense--blowout--labware')}
            />
          </CheckboxRow>

          <CheckboxRow
            checkboxAccessor='touch-tip'
            formConnector={formConnector}
            label='Touch tip'
          />
        </FormGroup>
      </div>
      <TipSettingsColumn />
    </div>
  </React.Fragment>
)

export default MixForm
