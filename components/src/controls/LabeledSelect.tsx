import * as React from 'react'

import { DropdownField } from '../forms'
import { LabeledControl } from './LabeledControl'
import styles from './styles.module.css'

import type { DropdownFieldProps } from '../forms'

export interface LabeledSelectProps extends DropdownFieldProps {
  label: string
  children: React.ReactNode
  /** optional data test id for the container */
  'data-test'?: string
}

export function LabeledSelect(props: LabeledSelectProps): JSX.Element {
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
