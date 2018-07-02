// @flow
import * as React from 'react'

import ControlInfo from './ControlInfo'
import ToggleButton from './ToggleButton'
import styles from './styles.css'

type Props = {
  label: string,
  toggledOn: boolean,
  children?: React.Node,
  onClick: () => mixed,
}

export default function LabeledToggle (props: Props) {
  const {label, toggledOn, onClick} = props

  return (
    <div className={styles.labeled_control_wrapper}>
      <label className={styles.labeled_control}>
        <p className={styles.labeled_control_label}>
          {label}
        </p>
        <ToggleButton
          className={styles.labeled_toggle_button}
          toggledOn={toggledOn}
          onClick={onClick}
        />
      </label>
      <ControlInfo>
        {props.children}
      </ControlInfo>
    </div>
  )
}
