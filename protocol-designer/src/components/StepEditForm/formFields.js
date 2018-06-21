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
import {selectors as steplistSelectors} from '../../steplist'
import {getFieldErrors} from '../../steplist/fieldLevel'
import type {StepFieldName} from '../../steplist/fieldLevel'
import {openWellSelectionModal, type OpenWellSelectionModalPayload} from '../../well-selection/actions'
import type {FormConnector} from '../../utils'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'
import {default as StepField, showFieldErrors} from './StepFormField'
import type {FocusHandlers} from './index'

type Options = Array<DropdownOption>

type CheckboxRowProps = {
  label?: string,
  name: StepFieldName,
  children?: ?React.Node,
  className?: string
}
export function CheckboxRow (props: CheckboxRowProps) {
  const {name, label, className} = props
  return (
    <StepField
      name={name}
      render={({value, updateValue}) => (
        <div className={styles.field_row}>
          <CheckboxField label={label} className={className} value={value} onChange={updateValue} />
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
      render={({value, updateValue, errorsToShow}) => (
        <InputField
          {...inputProps}
          error={errorsToShow}
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
      render={({value, updateValue, errorsToShow}) => (
        <RadioGroup
          {...radioGroupProps}
          value={value}
          error={errorsToShow}
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
    <CheckboxRow name={`${namePrefix}--delay--checkbox`} label={label}>
      <StepInputField
        {...focusHandlers}
        name={`${namePrefix}--delay-minutes`}
        units='m' />
      <StepInputField
        {...focusHandlers}
        name={`${namePrefix}--delay-seconds`}
        units='s' />
    </CheckboxRow>
  )
}

type MixFieldProps = { timesAccessor: string, volumeAccessor: string } & CheckboxRowProps
export function MixField (props: MixFieldProps) {
  const {checkboxAccessor, timesAccessor, volumeAccessor, label} = props
  return (
    <CheckboxRow name={checkboxAccessor} label={label || 'Mix'}>
      <StepInputField units='μL' name={timesAccessor} />
      <StepInputField units='Times' name={volumeAccessor} />
    </CheckboxRow>
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
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.target.value) } } />
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

// TODO: remove this and just use StepInputField like MixForm
type VolumeFieldProps = {formConnector: FormConnector<*>}
export const VolumeField = ({formConnector}: VolumeFieldProps) => (
  <FormGroup label='Volume:' className={styles.volume_field}>
    <InputField units='μL' {...formConnector('volume')} />
  </FormGroup>
)

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

// TODO Ian 2018-04-27 use selector to get num wells * 8 if multi-channel
// TODO: move this to helpers and correct pipette typing add in selectedPipette multiplier
const formatWellCount = (wells: Array<string>, selectedPipette: any) => {
  return wells ? wells.length : 0
}

type WellSelectionInputOP = {name: string, pipetteFieldName?: string, labwareFieldName?: string} & FocusHandlers
type WellSelectionInputSP = {
  _selectedPipetteId?: string,
  _selectedLabwareId: string,
  _wellFieldErrors: Array<string>, // TODO: real type
  wellCount: number
}
type WellSelectionInputDP = {_openWellSelectionModal: (OpenWellSelectionModalPayload) => void}
type WellSelectionInputProps = {
  wellCount: number,
  disabled: boolean,
  onClick?: (e: SyntheticMouseEvent<*>) => mixed,
  errorsToShow?: Array<string>
}

const WellSelectionInputSTP = (state: BaseState, ownProps: WellSelectionInputOP) => {
  const formData = steplistSelectors.getUnsavedForm(state)
  const selectedPipette = formData[ownProps.pipetteFieldName]
  const selectedLabware = formData[ownProps.labwareFieldName]
  const selectedWells = formData[ownProps.name]
  return {
    _selectedPipetteId: selectedPipette,
    _selectedLabwareId: selectedLabware,
    _wellFieldErrors: getFieldErrors(ownProps.name, selectedWells),
    wellCount: formatWellCount(selectedWells, selectedPipette)
  }
}
const WellSelectionInputDTP = (dispatch: ThunkDispatch<*>): WellSelectionInputDP => ({
  _openWellSelectionModal: (payload) => { dispatch(openWellSelectionModal(payload)) }
})
const WellSelectionInputMP = (
  stateProps: WellSelectionInputSP,
  dispatchProps: WellSelectionInputDP,
  ownProps: WellSelectionInputOP
): WellSelectionInputProps => {
  const {_selectedPipetteId, _selectedLabwareId, _wellFieldErrors} = stateProps
  // TODO: LATER: also 'disable' when selected labware is a trash
  const disabled = !(_selectedPipetteId && _selectedLabwareId)
  let showErrors: boolean = true
  if (ownProps.focusHandlers) {
    const {focusedField, dirtyFields} = ownProps.focusHandlers
    showErrors = showFieldErrors(ownProps.name, focusedField, dirtyFields)
  }
  return {
    disabled,
    wellCount: stateProps.wellCount,
    errorsToShow: showErrors && _wellFieldErrors,
    onClick: () => {
      if (ownProps.onFieldBlur) {
        ownProps.onFieldBlur(ownProps.name)
      }
      dispatchProps._openWellSelectionModal({
        pipetteId: _selectedPipetteId,
        labwareId: _selectedLabwareId,
        formFieldAccessor: ownProps.name
      })
    }
  }
  // // disabled
  // return {...stateProps, disabled}
}

const connectWellSelectionInput = connect(WellSelectionInputSTP, WellSelectionInputDTP, WellSelectionInputMP)

export const WellSelectionInput = connectWellSelectionInput((props: WellSelectionInputProps) => (
  <FormGroup label='Wells:' disabled={props.disabled} className={styles.well_selection_input}>
    <InputField
      readOnly
      value={props.wellCount}
      onClick={props.onClick}
      error={props.errorsToShow} />
  </FormGroup>
))
