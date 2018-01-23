// @flow
import * as React from 'react'
import styles from './forms.css'

type Props = {
  /** text label */
  label?: string,
  /** form content */
  children?: React.Node,
  /** classes to apply */
  className?: string
}

export default function FormGroup (props: Props) {
  return (
    <div className={props.className}>
      <div className={styles.formgroup_label}>{props.label}</div>
      {props.children}
    </div>
  )
}
