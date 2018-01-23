// @flow
import * as React from 'react'
import {
  FlatButton,
  PrimaryButton,
  FormGroup,
  DropdownField,
  CheckboxField,
  InputField,
  RadioGroup
} from '@opentrons/components'

import styles from './StepEditForm.css'

export default function StepEditForm () {
  return (
    <div className={styles.form}>
      {/* TODO: wrap below in collapsible FormSection, with title='Aspirate' */}
      <div>
        <div className={styles.top_row}>
          <FormGroup label='Labware:'>
            <DropdownField
              options={[
                {name: 'Starting Ingredients', value: ''}, /* NOTE: gotta ignore placeholder in DropdownField for onChange */
                {name: 'Ingredient 1', value: 'ingredId1'},
                {name: 'Ingredient 2', value: 'ingredId2'}
              ]}
            />
          </FormGroup>
          <FormGroup label='Wells:'>
            <InputField placeholder='eg "A1,A2,B1,B2"' />
          </FormGroup>
          <FormGroup label='Pipette:'>
            <DropdownField
              options={[
                {name: '10 μL Single', value: '10-single'}, /* TODO: should be 'p10 single'? What 'value'? */
                {name: '300 μL Single', value: '300-single'},
                {name: '10 μL Multi-Channel', value: '10-multi'},
                {name: '300 μL Multi-Channel', value: '300-multi'}
              ]}
            />
          </FormGroup>
        </div>

        <div className={styles.row_wrapper}>
          <div className={styles.half_col}>
            <FormGroup label='TECHNIQUE'>
              <CheckboxField label='Pre-wet tip' />
              <CheckboxField label='Touch tip' />
              <div className={styles.field_row}>
                <CheckboxField label='Air gap' />
                <InputField units='μL' />
              </div>
              <div className={styles.field_row}>
                <CheckboxField label='Mix' />
                <InputField units='μL' />
                <InputField units='Times' />
              </div>
              <div className={styles.field_row}>
                <CheckboxField label='Disposal volume' />
                <InputField units='μL' />
              </div>
            </FormGroup>
          </div>

          <div className={styles.half_col}>
            <FormGroup label='WELL ORDER'>
              (WellSelectionWidget here)
            </FormGroup>

            <FormGroup label='CHANGE TIP'>
              <RadioGroup
                inline
                options={[
                  {name: 'Always', value: 'always'},
                  {name: 'Once', value: 'once'},
                  {name: 'never', value: 'never'}
                ]}
              />
            </FormGroup>

            <FormGroup label='FLOW RATE'>
              (Flow rate SliderInput here)
            </FormGroup>
          </div>
        </div>

        <h3>TODO ^ use grid not flex see design</h3>
        <h3>TODO collapsible form section</h3>
        <h3>TODO lay out the bottom buttons</h3>

        <FlatButton>MORE OPTIONS</FlatButton>
        <PrimaryButton>CANCEL</PrimaryButton>
        <PrimaryButton>SAVE</PrimaryButton>
      </div>
    </div>
  )
}
