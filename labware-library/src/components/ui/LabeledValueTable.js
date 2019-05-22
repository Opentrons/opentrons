// @flow
import * as React from 'react'

import { Table, TableEntry, TABLE_COLUMN } from './Table'
import { LabelText, LABEL_TOP, LABEL_LEFT } from './LabelText'
import { Value } from './Value'
import { ClickableIcon } from './ClickableIcon'

import styles from './styles.css'

import type { TableDirection } from './Table'

export type ValueEntry = {
  label: React.Node,
  value: React.Node,
}

export type LabledValueTableProps = {
  label: React.Node,
  values: Array<ValueEntry>,
  direction?: TableDirection,
  className?: string,
  children?: React.Node,
}

export function LabeledValueTable(props: LabledValueTableProps) {
  const { label, values, direction, className, children } = props

  return (
    <div className={className}>
      <TableTitle label={label} onClick={null} />
      <Table direction={direction || TABLE_COLUMN}>
        {values.map((v, i) => (
          <TableEntry key={i}>
            <LabelText position={LABEL_LEFT}>{v.label}</LabelText>
            <Value>{v.value}</Value>
          </TableEntry>
        ))}
      </Table>
      {children}
    </div>
  )
}

type TableTitleProps = {
  label: React.Node,
  onClick: ?() => mixed, // Optional only for now to satisfy flow
}

export function TableTitle(props: TableTitleProps) {
  const { label, onClick } = props

  return (
    <div className={styles.table_title}>
      <LabelText position={LABEL_TOP}>{label}</LabelText>
      <ClickableIcon
        title="info"
        name="information"
        className={styles.info_button}
        onClick={onClick}
      />
    </div>
  )
}
