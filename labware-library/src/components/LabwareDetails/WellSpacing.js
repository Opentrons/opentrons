// @flow
// well dimensions and spacing for details page
import * as React from 'react'
import round from 'lodash/round'

import {
  WELL_TYPE_BY_CATEGORY,
  SPACING,
  MM,
  X_OFFSET,
  Y_OFFSET,
  X_SPACING,
  Y_SPACING,
} from '../../localization'

import styles from './styles.css'

import { LabeledValueTable, LowercaseText } from '../ui'

import type {
  LabwareDisplayCategory,
  LabwareWellGroupProperties,
} from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

const spacingValue = (spacing: number) =>
  spacing ? toFixed(spacing) : <span className={styles.lighter}>N/A</span>

export type WellSpacingProps = {
  wellProperties: LabwareWellGroupProperties,
  displayCategory: LabwareDisplayCategory,
  className?: string,
}

export default function WellSpacing(props: WellSpacingProps) {
  const { wellProperties, displayCategory, className } = props
  const wellType =
    WELL_TYPE_BY_CATEGORY[displayCategory] || WELL_TYPE_BY_CATEGORY.other

  const spacing = [
    { label: X_OFFSET, value: toFixed(wellProperties.xOffset) },
    { label: Y_OFFSET, value: toFixed(wellProperties.yOffset) },
    { label: X_SPACING, value: spacingValue(wellProperties.xSpacing) },
    { label: Y_SPACING, value: spacingValue(wellProperties.ySpacing) },
  ]

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {wellType} {SPACING} <LowercaseText>({MM})</LowercaseText>
        </>
      }
      values={spacing}
    />
  )
}
