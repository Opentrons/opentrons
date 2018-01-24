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

import FormSection from './FormSection'
import styles from './StepEditForm.css'

type Options = Array<{
  name: string,
  value: string
}>

type Props = {
  stepType: 'transfer' | 'distribute', /* TODO Ian 2018-01-24 support other steps */
  // ingredientOptions: Options,
  pipetteOptions: Options,
  labwareOptions: Options,
  onCancel: (event: SyntheticEvent<>) => void,
  onSave: (event: SyntheticEvent<>) => void,
  onChange: (accessor: string) => (event: SyntheticEvent<>) => void,
  formData: any /* TODO Ian 2018-01-24 **type** the different forms for different stepTypes,
    this obj reflects the form selector's return values */
}

export default function StepEditForm (props: Props) {
  return (
    <div className={styles.form}>
      <FormSection title='Aspirate' onCollapseToggle={e => console.log('TODO: collapse toggle')}> {/* TODO: should collapse be stateful to simplify Redux? */}
        <div className={styles.top_row}>
          <FormGroup label='Labware:'>
            <DropdownField options={props.labwareOptions} value={props.formData['aspirate--labware']} onChange={props.handleChange('aspirate--labware')} />
          </FormGroup>
          <FormGroup label='Wells:'>
            <InputField placeholder='eg "A1,A2,B1,B2"' value={props.formData['aspirate--wells']} onChange={props.handleChange('aspirate--wells')} />
          </FormGroup>
          <FormGroup label='Pipette:'>
            <DropdownField
              options={props.pipetteOptions}
            />
          </FormGroup>
        </div>

        <div className={styles.row_wrapper}>
          <div className={styles.column_1_2}>
            <FormGroup label='TECHNIQUE'>
              <CheckboxField label='Pre-wet tip' checked={props.formData['aspirate--pre-wet-tip']} onChange={props.handleChange('aspirate--pre-wet-tip')} />
              <CheckboxField label='Touch tip' checked={props.formData['aspirate--touch-tip']} onChange={props.handleChange('aspirate--touch-tip')} />
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
                <CheckboxField label='Disposal volume' className={styles.column_2_3} />
                <InputField units='μL' />
              </div>
            </FormGroup>
          </div>

          <div className={styles.column_1_2}>
            <FormGroup label='WELL ORDER'>
              (WellSelectionWidget here)
            </FormGroup>

            <FormGroup label='CHANGE TIP'>
              <RadioGroup
                inline
                checkedValue={props.formData['aspirate--change-tip']}
                onChange={props.handleChange('aspirate--change-tip')}
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

      </FormSection>

      <FormSection title='Dispense' onCollapseToggle={e => console.log('TODO: collapse toggle')}>
        <div className={styles.top_row}>
          <FormGroup label='Labware:'>
            <DropdownField options={props.labwareOptions} />
          </FormGroup>
          <FormGroup label='Wells:'>
            <InputField placeholder='eg "A1,A2,B1,B2"' />
          </FormGroup>
          <FormGroup label='Volume:'>
            <InputField placeholder='20' units='μL' />
          </FormGroup>
        </div>

        <div className={styles.row_wrapper}>
          <div className={styles.column_1_2}>
            <FormGroup label='TECHNIQUE'>
              <div className={styles.field_row}>
                <CheckboxField label='Mix' />
                <InputField units='μL' />
                <InputField units='Times' />
              </div>
              <div className={styles.field_row}>
                <CheckboxField label='Delay' />
                <InputField units='m' />
                <InputField units='s' />
              </div>
              <div className={styles.field_row}>
                <CheckboxField label='Blow out' />
                <DropdownField className={styles.column_2_3}
                  options={props.labwareOptions}
                />
              </div>
            </FormGroup>
          </div>

          <div className={styles.column_1_2}>
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

      </FormSection>

      <div className={styles.button_row}>
        <FlatButton onClick={e => window.alert('TODO: "MORE OPTIONS".')}>MORE OPTIONS</FlatButton>
        <PrimaryButton onClick={props.onCancel}>CANCEL</PrimaryButton>
        <PrimaryButton onClick={props.onSave}>SAVE</PrimaryButton>
      </div>
    </div>
  )
}
