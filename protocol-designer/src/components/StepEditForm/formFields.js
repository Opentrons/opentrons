// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {
  FormGroup,
  CheckboxField,
  InputField,
  DropdownField,
  type DropdownOption
} from '@opentrons/components'
import {selectors as fileDataSelectors} from '../../file-data'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../../labware-ingred/reducers'
import {openWellSelectionModal} from '../../well-selection/actions'
import type {FormConnector} from '../../utils'
import type {BaseState} from '../../types'
import styles from './StepEditForm.css'
import StepField from './StepFormField'

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

type DelayFieldsProps = {
  namePrefix: string,
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>
} & CheckboxRowProps
export function DelayFields (props: DelayFieldsProps) {
  const {label, namePrefix, focusedField, dirtyFields} = props
  return (
    <CheckboxRow name={`${namePrefix}--delay--checkbox`} label={label || 'Delay'} >
      <StepField
        name={`${namePrefix}--delay-minutes`}
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        render={({value, updateValue}) => (
          <InputField units='m' onChange={updateValue} value={value} />
        )} />
      <StepField
        name={`${namePrefix}--delay-seconds`}
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        render={({value, updateValue}) => (
          <InputField units='s' onChange={updateValue} value={value} />
        )} />
    </CheckboxRow>
  )
}

type MixFieldProps = {
  timesAccessor: string,
  volumeAccessor: string
} & CheckboxRowProps
export function MixField (props: MixFieldProps) {
  const {
    formConnector,
    checkboxAccessor,
    timesAccessor,
    volumeAccessor,
    label
  } = props

  return (
    <CheckboxRow
      checkboxAccessor={checkboxAccessor}
      formConnector={formConnector}
      label={label || 'Mix'}
    >
      <InputField units='μL' {...formConnector(timesAccessor)} />
      <InputField units='Times' {...formConnector(volumeAccessor)} />
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
          onChange={updateValue} />
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
    <StepField
      name={name}
      render={({value, updateValue}) => (
        <DropdownField
          className={className}
          options={labwareOptions}
          value={value}
          onChange={updateValue} />
      )} />
  )
})

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
        <DropdownField options={CHANGE_TIP_OPTIONS} onChange={updateValue} value={value} />
      </FormGroup>
    )} />

)

type TipSettingsColumnProps = {namePrefix: string, hasChangeField?: boolean}
export const TipSettingsColumn = (props: TipSettingsColumnProps) => (
  <div className={styles.right_settings_column}>
    {props.hasChangeField && <ChangeTipField name={`${props.namePrefix}--change-tip`} />}
    <FlowRateField />
    <TipPositionField />
  </div>
)


type WellSelectionInputOP = {
  name: string,
  pipetteFieldName?: string,
  labwareFieldName?: string
}
type WellSelectionInputSP = {selectedPipetteId?: string, selectedLabwareId: string}
type WellSelectionInputDP = {onClick?: (e: SyntheticMouseEvent<*>) => mixed}
type WellSelectionInputProps = WellSelectionInputOP & WellSelectionInputDP

const WellSelectionInputSTP = (state: BaseState, ownProps: WellSelectionInputOP) => {
  const formData = steplistSelectors.getUnsavedForm(state)
  return {
    selectedPipetteId: formData[ownProps.pipetteFieldName],
    selectedLabwareId: formData[ownProps.labwareFieldName]
  }
}
const WellSelectionInputDTP = {openWellSelectionModal: openWellSelectionModal}
const WellSelectionInputMP = (
  stateProps: WellSelectionInputSP,
  dispatchProps: WellSelectionInputDP,
  ownProps: WellSelectionInputOP
) => {
  const {selectedPipetteId, selectedLabwareId} = stateProps
  if (selectedPipetteId && selectedLabwareId) {
    return {
      onClick: () => {
        dispatchProps.openWellSelectionModal({
          pipetteId: selectedPipetteId,
          labwareId: selectedLabwareId,
          formFieldAccessor: ownProps.name
        })
      }
    }
  }
  // disabled
  return {...ownProps}
}

const connectWellSelectionInput = connect(WellSelectionInputSTP, WellSelectionInputDTP, WellSelectionInputMP)

const WellSelectorInput = (props: WellSelectionInputProps) => {
  const {initialSelectedWells, labwareId, pipetteId, onClick} = props
  const disabled = !(labwareId && pipetteId)

  return (
    <FormGroup label='Wells:' disabled={disabled} className={styles.well_selection_input}>
      <InputField
        readOnly
        value={initialSelectedWells && `${initialSelectedWells.length}`} // TODO Ian 2018-04-27 use selector to get num wells * 8 if multi-channel
        onClick={onClick}
      />
    </FormGroup>
  )
}
