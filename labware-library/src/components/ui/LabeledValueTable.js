// @flow
import * as React from 'react'
import cx from 'classnames'

import { Table, TableEntry, TABLE_COLUMN } from './Table'
import { LabelText, LABEL_LEFT } from './LabelText'
import { Value } from './Value'
import { ClickableIcon } from './ClickableIcon'
import { MeasurementGuide } from '../MeasurementGuide'

import styles from './styles.css'

import type { TableDirection } from './Table'
import type { DiagramProps } from '../MeasurementGuide'

export type ValueEntry = {
  label: React.Node,
  value: React.Node,
}

export type LabledValueTableProps = {
  ...DiagramProps,
  label: React.Node,
  values: Array<ValueEntry>,
  direction?: TableDirection,
  className?: string,
  children?: React.Node,
}

export function LabeledValueTable(props: LabledValueTableProps) {
  const [guideVisible, setGuideVisible] = React.useState<boolean>(false)
  const toggleGuide = () => setGuideVisible(!guideVisible)
  const {
    label,
    values,
    direction,
    className,
    children,
    category,
    guideType,
    insertCategory,
    shape,
    wellBottomShape,
    isIrregular,
  } = props
  return (
    <div className={className}>
      <TableTitle
        label={label}
        setGuideVisible={toggleGuide}
        guideVisible={guideVisible}
        category={category}
        guideType={guideType}
        insertCategory={insertCategory}
        shape={shape}
        wellBottomShape={wellBottomShape}
        isIrregular={isIrregular}
      />
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
  ...DiagramProps,
  label: React.Node,
  setGuideVisible: (visible: Boolean) => mixed,
|}

export function TableTitle(props: TableTitleProps) {
  const {
    label,
    setGuideVisible,
    guideVisible,
    category,
    guideType,
    insertCategory,
    shape,
    wellBottomShape,
    isIrregular,
  } = props

  const className = cx(styles.info_button, { [styles.active]: guideVisible })

  return (
    <div className={styles.table_title}>
      <div className={styles.table_title_text}>
        <LabelText position={LABEL_LEFT}>{label}</LabelText>
        <ClickableIcon
          title="info"
          name="information"
          className={className}
          onClick={setGuideVisible}
        />
      </div>
      <MeasurementGuide
        category={category}
        guideType={guideType}
        guideVisible={guideVisible}
        insertCategory={insertCategory}
        shape={shape}
        wellBottomShape={wellBottomShape}
        isIrregular={isIrregular}
      />
    </div>
  )
}
