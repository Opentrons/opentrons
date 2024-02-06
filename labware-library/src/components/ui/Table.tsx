// "table" of data, usually filled with LabelText and Value children
import * as React from 'react'
import cx from 'classnames'

import styles from './styles.module.css'

export type TableDirection = 'row' | 'column'

export const TABLE_COLUMN: TableDirection = 'column'
export const TABLE_ROW: TableDirection = 'row'

export interface TableProps {
  /** direction of table; defaults to "column" */
  direction?: TableDirection
  /** contents of the "table" */
  children: React.ReactNode
}

/**
 * Table - rows or columns of data, usually <TableEntry>
 */
export function Table(props: TableProps): JSX.Element {
  const { children } = props
  const direction = props.direction || TABLE_COLUMN
  const classes = cx(
    styles.table,
    direction === TABLE_COLUMN ? styles.column : styles.row
  )

  return <div className={classes}>{children}</div>
}

export interface TableEntryProps {
  /** contents of the "table" row or column */
  children: React.ReactNode
}

/**
 * TableEntry - A row or column in a <Table>, with children that are usually
 * <LabelText> and <Value> components
 */
export function TableEntry(props: TableEntryProps): JSX.Element {
  const { children } = props

  return <div className={styles.table_entry}>{children}</div>
}
