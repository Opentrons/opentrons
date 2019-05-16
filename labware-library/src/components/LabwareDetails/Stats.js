// @flow
// top-level labware stats
import * as React from 'react'

import { NUM_WELLS_BY_CATEGORY } from '../../localization'

import { TableEntry, LabelText, Value, LABEL_LEFT } from '../ui'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type StatsProps = {
  definition: LabwareDefinition,
}

export default function Stats(props: StatsProps) {
  const { definition } = props
  const { displayCategory } = definition.metadata
  const stats = [
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
