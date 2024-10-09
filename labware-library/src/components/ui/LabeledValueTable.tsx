import type * as React from 'react'
import { Table, TableEntry, TABLE_COLUMN } from './Table'
import { LabelText, LABEL_LEFT } from './LabelText'
import { Value } from './Value'
import { TableTitle } from './TableTitle'
import type { TableDirection } from './Table'

export interface ValueEntry {
  label: React.ReactNode
  value: React.ReactNode
}

export interface LabledValueTableProps {
  label: React.ReactNode
  values: ValueEntry[]
  direction?: TableDirection
  className?: string
  children?: React.ReactNode
  diagram?: React.ReactNode
}

export function LabeledValueTable(props: LabledValueTableProps): JSX.Element {
  const { label, values, direction, className, children, diagram } = props
  return (
    <div className={className}>
      <TableTitle label={label} diagram={diagram} />
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
