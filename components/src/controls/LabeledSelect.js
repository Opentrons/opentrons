// @flow
import * as React from 'react'

import { DropdownField } from '../forms'
import { LabeledControl } from './LabeledControl'
import styles from './styles.css'

import type { DropdownFieldProps } from '../forms'

export type LabeledSelectProps = {|
  ...DropdownFieldProps,
  label: string,
  children: React.Node,
|}

export function LabeledSelect(props: LabeledSelectProps): React.Node {
  const { label, value, options, onChange } = props

  return (
    <LabeledControl
      label={label}
      control={
        <DropdownField
          className={styles.labeled_select}
          value={value}
          options={options}
          onChange={onChange}
        />
      }
    >
      {props.children}
    </LabeledControl>
  )
}
