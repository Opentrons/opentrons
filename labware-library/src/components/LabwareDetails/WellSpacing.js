// @flow
// well dimensions and spacing for details page
import * as React from 'react'
import round from 'lodash/round'

import {
  MM,
  X_OFFSET,
  Y_OFFSET,
  X_SPACING,
  Y_SPACING,
  NA,
  VARIOUS,
} from '../../localization'

import styles from './styles.css'

import { LabeledValueTable, LowercaseText } from '../ui'

import type { LabwareWellGroupProperties } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

const spacingValue = (spacing: number | null) => {
  if (!spacing) {
    return (
      <span className={styles.lighter}>{spacing === null ? VARIOUS : NA}</span>
    )
  }

  return toFixed(spacing)
}

export type WellSpacingProps = {|
  title: string,
  wellProperties: LabwareWellGroupProperties,
  className?: string,
|}

export default function WellSpacing(props: WellSpacingProps) {
  const { title, wellProperties, className } = props
  // TODO (ka 2019-5-20): Revist this after grids definition is merged
  // const wellType =
  //   WELL_TYPE_BY_CATEGORY[displayCategory] || WELL_TYPE_BY_CATEGORY.other

  const spacing = [
    { label: X_OFFSET, value: toFixed(wellProperties.xOffsetFromLeft) },
    { label: Y_OFFSET, value: toFixed(wellProperties.yOffsetFromTop) },
    { label: X_SPACING, value: spacingValue(wellProperties.xSpacing) },
    { label: Y_SPACING, value: spacingValue(wellProperties.ySpacing) },
  ]

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {title} <LowercaseText>({MM})</LowercaseText>
        </>
      }
      values={spacing}
    />
  )
}
