// @flow
import * as React from 'react'

import { LABEL_LEFT, LabelText } from './LabelText'
import type { TableDirection } from './Table'
import { Table, TABLE_COLUMN, TableEntry } from './Table'
import { TableTitle } from './TableTitle'
import { Value } from './Value'

export type ValueEntry = {|
  label: React.Node,
  value: React.Node,
|}

export type LabledValueTableProps = {|
  label: React.Node,
  values: Array<ValueEntry>,
  direction?: TableDirection,
  className?: string,
  children?: React.Node,
  diagram?: React.Node,
|}

export function LabeledValueTable(props: LabledValueTableProps): React.Node {
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
