// @flow
// labware details page title and category
import * as React from 'react'

import { LabelText, Value, LABEL_TOP } from '../ui'

import {
  MANUFACTURER,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import type { LabwareBrand } from '../../types'

export type ManufacturerStatsProps = {|
  brand: LabwareBrand,
  className?: string,
|}

export function ManufacturerStats(props: ManufacturerStatsProps) {
  const { brand, className } = props
  const { brand: brandName } = brand
  const manfacturerValue =
    MANUFACTURER_LABELS_BY_MANUFACTURER[brandName] || brandName

  return (
    <div className={className}>
      <LabelText position={LABEL_TOP}>{MANUFACTURER}</LabelText>
      <Value>{manfacturerValue}</Value>
    </div>
  )
}
