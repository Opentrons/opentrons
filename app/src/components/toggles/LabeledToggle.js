// @flow
import * as React from 'react'

import {ToggleButton} from './'
import styles from './styles.css'

type Props = {
  label: React.Node,
  toggledOn: boolean,
  onClick: () => mixed
}

export default function LabeledToggle (props: Props) {
  const {label, toggledOn, onClick} = props

  return (
    <label className={styles.labeled_toggle}>
      <div className={styles.labeled_toggle_label}>
        {label}
      </div>
      <ToggleButton
        className={styles.labeled_toggle_button}
        toggledOn={toggledOn}
        onClick={onClick}
      />
    </label>
  )
}
