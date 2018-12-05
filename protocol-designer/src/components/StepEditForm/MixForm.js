// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'

import {
  StepInputField,
  StepCheckboxRow,
  BlowoutLocationDropdown,
  PipetteField,
  LabwareDropdown,
  ChangeTipField,
} from './formFields'

import FlowRateField from './FlowRateField'
import WellSelectionInput from './WellSelectionInput'
import TipPositionInput from './TipPositionInput'
import WellOrderInput from './WellOrderInput'
import type {FocusHandlers} from './index'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {focusHandlers: FocusHandlers}

const MixForm = (props: MixFormProps): React.Element<typeof React.Fragment> => {
  const {focusHandlers} = props
  return (
    <React.Fragment>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <LabwareDropdown name="labware" {...focusHandlers} />
        </FormGroup>
        <WellSelectionInput name="wells" labwareFieldName="labware" pipetteFieldName="pipette" {...focusHandlers} />
        <PipetteField name="pipette" {...focusHandlers} />
      </div>

      <div className={cx(formStyles.row_wrapper)}>
        <FormGroup label='Repetitions' className={cx(styles.field_row, styles.repetitions_row)}>
          <StepInputField name="volume" units='μL' {...focusHandlers} />
          <StepInputField name="times" units='Times' {...focusHandlers} />
        </FormGroup>
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <StepCheckboxRow name="dispense_blowout_checkbox" label='Blow out'>
              <BlowoutLocationDropdown
                name="dispense_blowout_location"
                className={styles.full_width}
                includeDestWell
                {...focusHandlers} />
            </StepCheckboxRow>
            <StepCheckboxRow name="touchTip" label='Touch tip'>
              <TipPositionInput fieldName="mix_touchTipMmFromBottom" />
            </StepCheckboxRow>
          </FormGroup>
        </div>

        <div className={styles.middle_settings_column}>
          <ChangeTipField stepType="mix" name="aspirate_changeTip" />
          <TipPositionInput fieldName="mix_mmFromBottom" />
        </div>
        <div className={styles.right_settings_column}>
          <FlowRateField
            name='aspirate_flowRate'
            label='Aspirate Flow Rate'
            pipetteFieldName='pipette'
            flowRateType='aspirate'
          />
          <WellOrderInput prefix="aspirate" />
          <FlowRateField
            name='dispense_flowRate'
            label='Dispense Flow Rate'
            pipetteFieldName='pipette'
            flowRateType='dispense'
          />
        </div>
      </div>
    </React.Fragment>
  )
}

export default MixForm
