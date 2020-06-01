// @flow
import * as React from 'react'

import { ControlInfo } from './ControlInfo'
import styles from './styles.css'

export type LabeledControlProps = {|
  label: string,
  control: React.Node,
  children?: React.Node,
|}

export function LabeledControl(props: LabeledControlProps): React.Node {
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
