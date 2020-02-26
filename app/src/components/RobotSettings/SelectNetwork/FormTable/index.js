// @flow
// presentational components for the wifi connect form
import * as React from 'react'
import styles from './styles.css'

export type FormTableProps = {|
  children: React.Node,
|}

export function FormTable(props: FormTableProps) {
  return <div className={styles.form_table}>{props.children}</div>
}
