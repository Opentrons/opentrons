import * as React from 'react'

import { ControlInfo } from './ControlInfo'
import styles from './styles.module.css'

export interface LabeledControlProps {
  label: string
  control: React.ReactNode
  children?: React.ReactNode
}

export function LabeledControl(props: LabeledControlProps): JSX.Element {
  const { label, control, children } = props

  return (
    <div className={styles.labeled_control_wrapper}>
      <div className={styles.labeled_control}>
        <p className={styles.labeled_control_label}>{label}</p>
        {control}
      </div>
      {children && <ControlInfo>{children}</ControlInfo>}
    </div>
  )
}
