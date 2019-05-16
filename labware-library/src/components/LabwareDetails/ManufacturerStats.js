// @flow
// labware details page title and category
import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'

import {
  MANUFACTURER,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareTitleProps = {
  definition: LabwareDefinition,
}

export default function ManufacturerStats(props: LabwareTitleProps) {
  const { definition } = props
  const { brand } = definition.brand
  const manfacturerProps = {
    label: MANUFACTURER,
    value: MANUFACTURER_LABELS_BY_MANUFACTURER[brand] || brand,
  }

  return (
    <div className={styles.manufacturer_container}>
      <LabelText position={LABEL_LEFT}>{manfacturerProps.label}</LabelText>
      <Value>{manfacturerProps.value}</Value>
    </div>
  )
}
