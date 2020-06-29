// @flow
import * as React from 'react'

import { LabeledControl } from './LabeledControl'
import styles from './styles.css'
import { ToggleButton } from './ToggleButton'

export type LabeledToggleProps = {|
  label: string,
  toggledOn: boolean,
  children?: React.Node,
  onClick: () => mixed,
|}

export function LabeledToggle(props: LabeledToggleProps): React.Node {
  const { label, toggledOn, onClick } = props

  return (
    <LabeledControl
      label={label}
      control={
        <ToggleButton
          className={styles.labeled_toggle_button}
          toggledOn={toggledOn}
          onClick={onClick}
        />
      }
    >
      {props.children}
    </LabeledControl>
  )
}
