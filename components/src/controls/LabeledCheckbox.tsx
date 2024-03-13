import * as React from 'react'
import cx from 'classnames'

import { DeprecatedCheckboxField } from '../forms'
import { LabeledControl } from './LabeledControl'
import styles from './styles.module.css'

export interface LabeledCheckboxProps {
  label: string
  name: string
  value: boolean
  className?: string
  children: React.ReactNode
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export function LabeledCheckbox(props: LabeledCheckboxProps): JSX.Element {
  const { label, value, name, onChange } = props
  const checkboxClass = cx(styles.labeled_checkbox, props.className)
  return (
    <LabeledControl
      label={label}
      control={
        <DeprecatedCheckboxField
          className={checkboxClass}
          name={name}
          value={value}
          onChange={onChange}
        />
      }
    >
      {props.children}
    </LabeledControl>
  )
}
