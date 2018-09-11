// @flow
import * as React from 'react'

import ControlInfo from './ControlInfo'
import styles from './styles.css'

type Props = {
  label: string,
  control: React.Node,
  children?: React.Node,
}

export default function LabeledControl (props: Props) {
  const {label, control, children} = props

  return (
    <div className={styles.labeled_control_wrapper}>
      <div className={styles.labeled_control}>
        <p className={styles.labeled_control_label}>
          {label}
        </p>
        {control}
      </div>
      <ControlInfo>
        {children}
      </ControlInfo>
    </div>
  )
}
