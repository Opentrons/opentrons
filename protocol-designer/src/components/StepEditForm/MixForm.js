// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'

import {
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  PipetteField,
  LabwareField,
  ChangeTipField,
  FlowRateField,
  WellSelectionField,
  TipPositionField,
  WellOrderField,
} from './fields'

import type {FocusHandlers} from './index'
import formStyles from '../forms/forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {focusHandlers: FocusHandlers}

const MixForm = (props: MixFormProps): React.Element<typeof React.Fragment> => {
  const {focusHandlers} = props
  return (
    <React.Fragment>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <LabwareField name="labware" {...focusHandlers} />
        </FormGroup>
        <WellSelectionField name="wells" labwareFieldName="labware" pipetteFieldName="pipette" {...focusHandlers} />
        <PipetteField name="pipette" {...focusHandlers} />
      </div>

      <div className={cx(formStyles.row_wrapper)}>
        <FormGroup label='Repetitions' className={cx(styles.field_row, styles.repetitions_row)}>
          <TextField name="volume" units='μL' {...focusHandlers} />
          <TextField name="times" units='Times' {...focusHandlers} />
        </FormGroup>
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <CheckboxRowField name="dispense_blowout_checkbox" label='Blow out'>
              <BlowoutLocationField
                name="dispense_blowout_location"
                className={styles.full_width}
                includeDestWell
                {...focusHandlers} />
            </CheckboxRowField>
            <CheckboxRowField name="touchTip" label='Touch tip'>
              <TipPositionField fieldName="mix_touchTipMmFromBottom" />
            </CheckboxRowField>
          </FormGroup>
        </div>

        <div className={styles.middle_settings_column}>
          <ChangeTipField stepType="mix" name="aspirate_changeTip" />
          <TipPositionField fieldName="mix_mmFromBottom" />
        </div>
        <div className={styles.right_settings_column}>
          <FlowRateField
            name='aspirate_flowRate'
            label='Aspirate Flow Rate'
            pipetteFieldName='pipette'
            flowRateType='aspirate'
          />
          <WellOrderField prefix="aspirate" />
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
