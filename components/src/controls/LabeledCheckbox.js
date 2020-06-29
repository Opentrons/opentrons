// @flow
import cx from 'classnames'
import * as React from 'react'

import { CheckboxField } from '../forms'
import { LabeledControl } from './LabeledControl'
import styles from './styles.css'

export type LabeledCheckboxProps = {|
  label: string,
  name: string,
  value: boolean,
  className?: string,
  children: React.Node,
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
|}

export function LabeledCheckbox(props: LabeledCheckboxProps): React.Node {
  const { label, value, name, onChange } = props
  const checkboxClass = cx(styles.labeled_checkbox, props.className)
  return (
    <LabeledControl
      label={label}
      control={
        <CheckboxField
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
