// @flow
import * as React from 'react'

import { ControlInfo } from './ControlInfo'
import styles from './styles.css'

export type StackedLabeledControlProps = {|
  label: string,
  control: React.Node,
  children?: React.Node,
|}

export function StackedLabeledControl(
  props: StackedLabeledControlProps
): React.Node {
  const { label, control, children } = props

  return (
    <div className={styles.labeled_control_wrapper}>
      <p className={styles.stacked_labeled_control_label}>{label}</p>
      {children && (
        <ControlInfo className={styles.stacked_control_info}>
          {children}
        </ControlInfo>
      )}
      <div className={styles.stacked_labeled_control}>{control}</div>
    </div>
  )
}
