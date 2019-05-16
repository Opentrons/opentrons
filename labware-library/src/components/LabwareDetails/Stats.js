// @flow
// top-level labware stats
import * as React from 'react'

import {
  MANUFACTURER,
  NUM_WELLS_BY_CATEGORY,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import { TableEntry, LabelText, Value, LABEL_LEFT } from '../ui'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type StatsProps = {
  definition: LabwareDefinition,
}

export default function Stats(props: StatsProps) {
  const { definition } = props
  const { brand } = definition.brand
  const { displayCategory } = definition.metadata
  const stats = [
    {
      label: MANUFACTURER,
      value: MANUFACTURER_LABELS_BY_MANUFACTURER[brand] || brand,
    },
    {
      label:
        NUM_WELLS_BY_CATEGORY[displayCategory] || NUM_WELLS_BY_CATEGORY.other,
      value: Object.keys(definition.wells).length,
    },
  ]

  return (
    <div className={styles.stats}>
      {stats.map((s, i) => (
        <TableEntry key={i}>
          <LabelText position={LABEL_LEFT}>{s.label}</LabelText>
          <Value>{s.value}</Value>
        </TableEntry>
      ))}
    </div>
  )
}
