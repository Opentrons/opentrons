// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {
  FormGroup,
  CheckboxField,
  InputField,
  DropdownField,
  RadioGroup,
  type DropdownOption
} from '@opentrons/components'
import {selectors as pipetteSelectors} from '../../pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {BaseState} from '../../types'
import styles from './StepEditForm.css'
import StepField from './StepFormField'
import type {FocusHandlers} from './index'

type Options = Array<DropdownOption>

type StepCheckboxRowProps = {
  label?: string,
  name: StepFieldName,
  children?: ?React.Node,
  className?: string
}
export function StepCheckboxRow (props: StepCheckboxRowProps) {
  const {name, label, className} = props
  return (
    <StepField
      name={name}
      render={({value, updateValue}) => (
        <div className={styles.field_row}>
          <CheckboxField
            label={label}
            className={className}
            value={!!value}
            onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
          {value ? props.children : null}
        </div>
      )} />
  )
}

type StepInputFieldProps = {name: StepFieldName} & FocusHandlers
export const StepInputField = (props: StepInputFieldProps & React.ElementProps<typeof InputField>) => {
  const {name, focusedField, dirtyFields, onFieldFocus, onFieldBlur, ...inputProps} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow}) => (
        <InputField
          {...inputProps}
          error={errorToShow}
          onBlur={() => { onFieldBlur(name) }}
          onFocus={() => { onFieldFocus(name) }}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(e.currentTarget.value)}
          value={value ? String(value) : null} />
      )} />
  )
}

type StepRadioGroupProps = {name: StepFieldName, options: Options} & FocusHandlers
export const StepRadioGroup = (props: StepRadioGroupProps) => {
  const {name, onFieldFocus, onFieldBlur, focusedField, dirtyFields, ...radioGroupProps} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow}) => (
        <RadioGroup
          {...radioGroupProps}
          value={value ? String(value) : ''}
          error={errorToShow}
          onChange={(e: SyntheticEvent<*>) => {
            updateValue(e.currentTarget.value)
            onFieldBlur(name)
          }} />
      )} />
  )
}

type DispenseDelayFieldsProps = {
  focusHandlers: FocusHandlers,
  label?: string
}
export function DispenseDelayFields (props: DispenseDelayFieldsProps) {
  const {label = 'Delay', focusHandlers} = props
  return (
    <StepCheckboxRow name="dispense_delay_checkbox" label={label}>
      <StepInputField {...focusHandlers} name="dispense_delayMinutes" units='m' />
      <StepInputField {...focusHandlers} name="dispense_delaySeconds" units='s' />
    </StepCheckboxRow>
  )
}

type PipetteFieldOP = {name: StepFieldName} & FocusHandlers
type PipetteFieldSP = {pipetteOptions: Options}
const PipetteFieldSTP = (state: BaseState): PipetteFieldSP => ({
  pipetteOptions: pipetteSelectors.equippedPipetteOptions(state)
})
export const PipetteField = connect(PipetteFieldSTP)((props: PipetteFieldOP & PipetteFieldSP) => (
  <StepField
    name={props.name}
    focusedField={props.focusedField}
    dirtyFields={props.dirtyFields}
    render={({value, updateValue}) => (
      <FormGroup label='Pipette:' className={styles.pipette_field}>
        <DropdownField
          options={props.pipetteOptions}
          value={value ? String(value) : null}
          onBlur={() => { props.onFieldBlur(props.name) }}
          onFocus={() => { props.onFieldFocus(props.name) }}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      </FormGroup>
    )} />
))

type LabwareDropdownOP = {name: StepFieldName, className?: string} & FocusHandlers
type LabwareDropdownSP = {labwareOptions: Options}
const LabwareDropdownSTP = (state: BaseState): LabwareDropdownSP => ({
  labwareOptions: labwareIngredSelectors.labwareOptions(state)
})
export const LabwareDropdown = connect(LabwareDropdownSTP)((props: LabwareDropdownOP & LabwareDropdownSP) => {
  const {labwareOptions, name, className, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = props
  return (
    // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue}) => (
        <DropdownField
          className={className}
          options={labwareOptions}
          onBlur={() => { onFieldBlur(name) }}
          onFocus={() => { onFieldFocus(name) }}
          value={value ? String(value) : null}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      )} />
  )
})

// NOTE 2018-05-31 Flow rate cannot yet be adjusted,
// this is a placeholder
export const FlowRateField = () => <FormGroup label='FLOW RATE'>Default</FormGroup>

// NOTE 2018-05-31 Tip position cannot yet be adjusted,
// this is a placeholder
export const TipPositionField = () => <FormGroup label='TIP POSITION'>Bottom, center</FormGroup>

const CHANGE_TIP_OPTIONS = [
  {name: 'Always', value: 'always'},
  {name: 'Once', value: 'once'},
  {name: 'Never', value: 'never'}
]
// NOTE: ChangeTipField not validated as of 6/27/18 so no focusHandlers needed
type ChangeTipFieldProps = {name: StepFieldName}
export const ChangeTipField = (props: ChangeTipFieldProps) => (
  <StepField
    name={props.name}
    render={({value, updateValue}) => (
      <FormGroup label='CHANGE TIP'>
        <DropdownField
          options={CHANGE_TIP_OPTIONS}
          value={value ? String(value) : null}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      </FormGroup>
    )} />
)
