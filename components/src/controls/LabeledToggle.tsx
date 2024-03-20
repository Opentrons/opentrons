import * as React from 'react'

import { LabeledControl } from './LabeledControl'
import { ToggleButton } from './ToggleButton'
import styles from './styles.module.css'

export interface LabeledToggleProps {
  label: string
  toggledOn: boolean
  disabled?: boolean
  children?: React.ReactNode
  onClick: () => unknown
  /** optional data test id for the container */
  'data-test'?: string
}

export function LabeledToggle(props: LabeledToggleProps): JSX.Element {
  const { label, toggledOn, disabled, onClick } = props

  return (
    <LabeledControl
      label={label}
      control={
        <ToggleButton
          className={styles.labeled_toggle_button}
          toggledOn={toggledOn}
          disabled={disabled}
          onClick={onClick}
        />
      }
    >
      {props.children}
    </LabeledControl>
  )
}
