// @flow
import * as React from 'react'
import {FormGroup, CheckboxField} from '@opentrons/components'
import styles from './StepEditForm.css'
import StepField from './StepFormField'
import TextField from './Text'
import BlowoutLocationField from './BlowoutLocation'
import type {FocusHandlers} from './index'

type DisposalVolumeFieldProps = {focusHandlers: FocusHandlers}
export const DisposalVolumeFields = (props: DisposalVolumeFieldProps) => (
  <FormGroup label='Multi-Dispense Options:'>
    <StepField
      name="aspirate_disposalVol_checkbox"
      render={({value, updateValue}) => (
        <React.Fragment>
          <div className={styles.field_row}>
            <CheckboxField
              label="Disposal Volume"
              value={!!value}
              onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
            {
              value
                ? (
                  <div>
                    <TextField name="aspirate_disposalVol_volume" units="μL" {...props.focusHandlers} />
                  </div>
                )
                : null
            }
          </div>
          {
            value
              ? (
                <div className={styles.field_row}>
                  <div className={styles.sub_select_label}>Blowout</div>
                  <BlowoutLocationField
                    name="blowout_location"
                    className={styles.full_width}
                    includeSourceWell
                    {...props.focusHandlers} />
                </div>
              )
              : null
          }
        </React.Fragment>
      )} />
  </FormGroup>
)
