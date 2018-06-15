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
import type {FormConnector} from '../../utils'
import styles from './StepEditForm.css'

type Options = Array<DropdownOption>

type CheckboxRowProps = {
  label?: string,
  formConnector: FormConnector<*>,
  checkboxAccessor: string,
  children?: ?React.Node,
  className?: string
}
export function CheckboxRow (props: CheckboxRowProps) {
  const {formConnector, checkboxAccessor, label, className} = props

  const checked = formConnector(checkboxAccessor).value

  return (
    <div className={styles.field_row}>
      <CheckboxField label={label} className={className}
        {...formConnector(checkboxAccessor)} />
      {checked ? props.children : null}
    </div>
  )
}

type DelayFieldProps = {
  minutesAccessor: string,
  secondsAccessor: string
} & CheckboxRowProps
export function DelayField (props: DelayFieldProps) {
  const {
    formConnector,
    checkboxAccessor,
    minutesAccessor,
    secondsAccessor,
    label
  } = props

  return (
    <CheckboxRow
      checkboxAccessor={checkboxAccessor}
      formConnector={formConnector}
      label={label || 'Delay'}
    >
      <InputField units='m' {...formConnector(minutesAccessor)} />
      <InputField units='s' {...formConnector(secondsAccessor)} />
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

const PipetteFieldSTP = state => ({pipetteOptions: fileDataSelectors.equippedPipetteOptions(state)})
type PipetteFieldProps = {formConnector: FormConnector<*>, pipetteOptions: Options}
export const ConnectedPipetteField = connect(PipetteFieldSTP, (dispatch: Dispatch) => ({dispatch: dispatch}))(
  ({formConnector, pipetteOptions}: PipetteFieldProps) => (
    <FormGroup label='Pipette:' className={styles.pipette_field}>
      <DropdownField options={pipetteOptions} {...formConnector('pipette')} />
    </FormGroup>
  )
)

const LabwareDropdownSTP = state => ({labwareOptions: labwareIngredSelectors.labwareOptions(state)})
type LabwareDropdownStateProps = {labwareOptions: Options}
type LabwareDropdownOwnProps = {formConnector: FormConnector<*>}
export const LabwareDropdown = connect(LabwareDropdownSTP, (dispatch: Dispatch) => ({dispatch: dispatch}))(
  ({labwareOptions, ...restProps}: LabwareDropdownOwnProps & LabwareDropdownStateProps) => (
    <DropdownField options={labwareOptions} {...restProps} />
  )
)

type VolumeFieldProps = {formConnector: FormConnector<*>}
export const VolumeField = ({formConnector}: VolumeFieldProps) => (
  <FormGroup label='Volume:' className={styles.volume_field}>
    <InputField units='μL' {...formConnector('volume')} />
  </FormGroup>
)

// NOTE 2018-05-31 Flow rate cannot yet be adjusted,
// this is a placeholder
export const FlowRateField = () => (
  <FormGroup label='FLOW RATE'>
    Default
  </FormGroup>
)

// NOTE 2018-05-31 Tip position cannot yet be adjusted,
// this is a placeholder
export const TipPositionField = () => (
  <FormGroup label='TIP POSITION'>
    Bottom, center
  </FormGroup>
)

type ChangeTipFieldProps = {formConnector: FormConnector<*>}
export const ChangeTipField = ({formConnector}: ChangeTipFieldProps) => (
  <FormGroup label='CHANGE TIP'>
    <DropdownField
      {...formConnector('aspirate--change-tip')}
      options={[
        {name: 'Always', value: 'always'},
        {name: 'Once', value: 'once'},
        {name: 'Never', value: 'never'}
      ]}
    />
  </FormGroup>
)

type TipSettingsColumnProps = {formConnector: FormConnector<*>, hasChangeField?: boolean}
export const TipSettingsColumn = ({formConnector, hasChangeField = true}: TipSettingsColumnProps) => (
  <div className={styles.right_settings_column}>
    {hasChangeField && <ChangeTipField formConnector={formConnector} />}
    <FlowRateField />
    <TipPositionField />
  </div>
)
