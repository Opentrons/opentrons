// @flow
import * as React from 'react'
import {
  FormGroup,
  CheckboxField,
  InputField
} from '@opentrons/components'

import styles from './StepEditForm.css'
import type {FormConnector} from '../../utils'

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

export function FlowRateField () {
  // NOTE 2018-05-31 Flow rate cannot yet be adjusted,
  // this is a placeholder
  return (
    <FormGroup label='FLOW RATE'>
      Default
    </FormGroup>
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

export function TipPositionField () {
  // NOTE 2018-05-31 Tip position cannot yet be adjusted,
  // this is a placeholder
  return (
    <FormGroup label='TIP POSITION'>
      Bottom, center
    </FormGroup>
  )
}
