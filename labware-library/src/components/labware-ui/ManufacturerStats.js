// @flow
// labware details page title and category
import * as React from 'react'

import { LabelText, Value, LABEL_TOP } from '../ui'

import {
  MANUFACTURER,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import type { LabwareDefinition } from '../../types'

export type ManufacturerStatsProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function ManufacturerStats(props: ManufacturerStatsProps) {
  const { definition, className } = props
  const { brand } = definition.brand
  const manfacturerValue = MANUFACTURER_LABELS_BY_MANUFACTURER[brand] || brand

  return (
    <div className={className}>
      <LabelText position={LABEL_TOP}>{MANUFACTURER}</LabelText>
      <Value>{manfacturerValue}</Value>
    </div>
  )
}
