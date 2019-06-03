// @flow
import * as React from 'react'
import cx from 'classnames'

import { Table, TableEntry, TABLE_COLUMN } from './Table'
import { LabelText, LABEL_LEFT } from './LabelText'
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
  diagram?: React.Node,
}

export function LabeledValueTable(props: LabledValueTableProps) {
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

type TableTitleProps = {|
  label: React.Node,
  diagram?: React.Node,
|}

export function TableTitle(props: TableTitleProps) {
  const [guideVisible, setGuideVisible] = React.useState<boolean>(false)
  const toggleGuide = () => setGuideVisible(!guideVisible)
  const { label, diagram } = props

  const iconClassName = cx(styles.info_button, {
    [styles.active]: guideVisible,
  })

  const contentClassName = cx(styles.expandable_content, {
    [styles.open]: guideVisible,
  })

  return (
    <div className={styles.table_title}>
      <div className={styles.table_title_text}>
        <LabelText position={LABEL_LEFT}>{label}</LabelText>
        <ClickableIcon
          title="info"
          name="information"
          className={iconClassName}
          onClick={toggleGuide}
        />
      </div>
      <div className={contentClassName}>{diagram}</div>
    </div>
  )
}
