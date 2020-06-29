// @flow
import * as React from 'react'

import type { DropdownFieldProps } from '../forms'
import { DropdownField } from '../forms'
import { LabeledControl } from './LabeledControl'
import styles from './styles.css'

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
