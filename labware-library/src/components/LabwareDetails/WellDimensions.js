// @flow
// well dimensions and spacing for details page
import * as React from 'react'
import round from 'lodash/round'

import { MM, X_DIM, Y_DIM, DEPTH, DIAMETER } from '../../localization'

import { LabeledValueTable, LowercaseText } from '../ui'

import type { LabwareWellGroupProperties } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

export type WellDimensionsProps = {|
  title: string,
  wellProperties: LabwareWellGroupProperties,
  className?: string,
|}

export default function WellDimensions(props: WellDimensionsProps) {
  const { title, wellProperties, className } = props

  const dimensions = [
    { label: DEPTH, value: toFixed(wellProperties.depth) },
    wellProperties.diameter != null
      ? { label: DIAMETER, value: toFixed(wellProperties.diameter) }
      : null,
    wellProperties.xDimension != null
      ? { label: X_DIM, value: toFixed(wellProperties.xDimension) }
      : null,
    wellProperties.yDimension != null
      ? { label: Y_DIM, value: toFixed(wellProperties.yDimension) }
      : null,
  ].filter(Boolean)

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {title} <LowercaseText>({MM})</LowercaseText>
        </>
      }
      values={dimensions}
    />
  )
}
