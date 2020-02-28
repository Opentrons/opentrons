// @flow
// presentational components for the wifi connect form
import * as React from 'react'
import styles from './styles.css'

export type FormTableProps = {|
  children: React.Node,
|}

export type FormRowProps = {|
  label?: string,
  labelFor?: string,
  children: React.Node,
|}

export function FormTable(props: FormTableProps) {
  return <div className={styles.form_table}>{props.children}</div>
}

export function FormTableRow(props: FormRowProps) {
  const label = props.label ? (
    <label htmlFor={props.labelFor} className={styles.form_table_label}>
      {props.label}
    </label>
  ) : (
    <span className={styles.form_table_label} />
  )

  const inputClassName = props.label
    ? styles.form_table_input
    : styles.form_table_input_no_label

  return (
    <div className={styles.form_table_row}>
      {label}
      <div className={inputClassName}>{props.children}</div>
    </div>
  )
}
