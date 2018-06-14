// @flow
import * as React from 'react'
import {
  FormGroup,
  DropdownField,
  InputField
} from '@opentrons/components'

import {
  CheckboxRow,
  DelayField,
  MixField,
  ConnectedPipetteField,
  ConnectedLabwareOptionsDropdown,
  VolumeField,
  TipSettingsColumn
} from './formFields'

import WellSelectionInput from '../../containers/WellSelectionInput'
import FormSection from './FormSection'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import type {FormConnector} from '../../utils'
import type {FormData} from '../../form-types'

type TransferLikeFormProps = {formData: FormData, formConnector: FormConnector<*>}

const TransferLikeForm = ({formData, formConnector}: TransferLikeFormProps) => (
  <React.Fragment>
    <FormSection sectionName='aspirate'>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <ConnectedLabwareOptionsDropdown {...formConnector('aspirate--labware')} />
        </FormGroup>
        {/* TODO LATER: also 'disable' when selected labware is a trash */}
        <WellSelectionInput
          className={styles.well_selection_input}
          labwareId={formData['aspirate--labware']}
          pipetteId={formData['pipette']}
          initialSelectedWells={formData['aspirate--wells']}
          formFieldAccessor={'aspirate--wells'}
        />
        <ConnectedPipetteField formConnector={formConnector}/>
        {formData.stepType === 'consolidate' && <VolumeField formConnector={formConnector} />}
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <CheckboxRow
              checkboxAccessor='aspirate--pre-wet-tip'
              formConnector={formConnector}
              label='Pre-wet tip'
            />

            <CheckboxRow
              checkboxAccessor='aspirate--touch-tip'
              formConnector={formConnector}
              label='Touch tip'
            />

            <CheckboxRow
              checkboxAccessor='aspirate--air-gap--checkbox'
              formConnector={formConnector}
              label='Air Gap'
            >
              <InputField units='μL' {...formConnector('aspirate--air-gap--volume')} />
            </CheckboxRow>

            <MixField
              checkboxAccessor='aspirate--mix--checkbox'
              formConnector={formConnector}
              timesAccessor='aspirate--mix--times'
              volumeAccessor='aspirate--mix--volume'
            />

            <CheckboxRow
              checkboxAccessor='aspirate--disposal-vol--checkbox'
              formConnector={formConnector}
              label='Disposal Volume'
            >
              <InputField units='μL' {...formConnector('aspirate--disposal-vol--volume')} />
            </CheckboxRow>
          </FormGroup>
        </div>
        <TipSettingsColumn formConnector={formConnector} />
      </div>
    </FormSection>

    <FormSection sectionName='dispense'>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <ConnectedLabwareOptionsDropdown {...formConnector('dispense--labware')} />
        </FormGroup>
        <WellSelectionInput
          className={styles.well_selection_input}
          labwareId={formData['dispense--labware']}
          pipetteId={formData['pipette']}
          initialSelectedWells={formData['dispense--wells']}
          formFieldAccessor={'dispense--wells'}
        />
        {(formData.stepType === 'transfer' || formData.stepType === 'distribute') &&
          <VolumeField formConnector={formConnector} />}
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <MixField
              checkboxAccessor='dispense--mix--checkbox'
              formConnector={formConnector}
              volumeAccessor='dispense--mix--volume'
              timesAccessor='dispense--mix--times'
            />
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
          </FormGroup>
        </div>
        <TipSettingsColumn hasChangeField={false} />
      </div>
    </FormSection>
  </React.Fragment>
)

export default TransferLikeForm
