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
  const { shape } = wellProperties
  const dimensions = [{ label: DEPTH, value: wellProperties.depth }]

  if (shape) {
    if (shape.shape === 'circular') {
      dimensions.push({ label: DIAMETER, value: toFixed(shape.diameter) })
    } else if (shape.shape === 'rectangular') {
      dimensions.push(
        { label: X_DIM, value: toFixed(shape.xDimension) },
        { label: Y_DIM, value: toFixed(shape.yDimension) }
      )
    }
  }

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
