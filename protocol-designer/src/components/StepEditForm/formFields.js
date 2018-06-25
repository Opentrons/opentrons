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
import {selectors as fileDataSelectors} from '../../file-data'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {BaseState} from '../../types'
import styles from './StepEditForm.css'
import {default as StepField} from './StepFormField'
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
          <CheckboxField label={label} className={className} value={!!value} onChange={updateValue} />
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
          onChange={(e: SyntheticEvent<HTMLInputElement>) => updateValue(e.target.value)}
          value={value} />
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
          value={value}
          error={errorToShow}
          onChange={(e: SyntheticInputEvent<>) => {
            updateValue(e.target.value)
            onFieldBlur(name)
          }} />
      )} />
  )
}

type DelayFieldsProps = {
  namePrefix: string,
  focusHandlers: FocusHandlers,
  label?: string
}
export function DelayFields (props: DelayFieldsProps) {
  const {label = 'Delay', namePrefix, focusHandlers} = props
  return (
    <StepCheckboxRow name={`${namePrefix}--delay--checkbox`} label={label}>
      <StepInputField
        {...focusHandlers}
        name={`${namePrefix}--delay-minutes`}
        units='m' />
      <StepInputField
        {...focusHandlers}
        name={`${namePrefix}--delay-seconds`}
        units='s' />
    </StepCheckboxRow>
  )
}

type PipetteFieldOP = {name: StepFieldName}
type PipetteFieldSP = {pipetteOptions: Options}
const PipetteFieldSTP = (state: BaseState): PipetteFieldSP => ({
  pipetteOptions: fileDataSelectors.equippedPipetteOptions(state)
})
export const PipetteField = connect(PipetteFieldSTP)((props: PipetteFieldOP & PipetteFieldSP) => (
  <StepField
    name={props.name}
    render={({value, updateValue}) => (
      <FormGroup label='Pipette:' className={styles.pipette_field}>
        <DropdownField
          options={props.pipetteOptions}
          value={value}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      </FormGroup>
    )} />
))

type LabwareDropdownOP = {name: StepFieldName, className?: string}
type LabwareDropdownSP = {labwareOptions: Options}
const LabwareDropdownSTP = (state: BaseState): LabwareDropdownSP => ({
  labwareOptions: labwareIngredSelectors.labwareOptions(state)
})
export const LabwareDropdown = connect(LabwareDropdownSTP)((props: LabwareDropdownOP & LabwareDropdownSP) => {
  const {labwareOptions, name, className} = props
  return (
    // TODO: BC abstract e.target.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
    <StepField
      name={name}
      render={({value, updateValue}) => (
        <DropdownField
          className={className}
          options={labwareOptions}
          value={value}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.target.value) } } />
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
type ChangeTipFieldProps = {name: StepFieldName}
export const ChangeTipField = (props: ChangeTipFieldProps) => (
  <StepField
    name={props.name}
    render={({value, updateValue}) => (
      <FormGroup label='CHANGE TIP'>
        <DropdownField
          options={CHANGE_TIP_OPTIONS}
          value={value}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.target.value) } } />
      </FormGroup>
    )} />

)

type TipSettingsColumnProps = {namePrefix: string, hasChangeField?: boolean}
export const TipSettingsColumn = (props: TipSettingsColumnProps) => {
  const {namePrefix, hasChangeField = true} = props
  return (
    <div className={styles.right_settings_column}>
      {hasChangeField && <ChangeTipField name={`${namePrefix}--change-tip`} />}
      <FlowRateField />
      <TipPositionField />
    </div>
  )
}
