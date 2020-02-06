// @flow
// well dimensions and spacing for details page
import * as React from 'react'
import round from 'lodash/round'

import {
  MEASUREMENTS,
  WELL_X_DIM,
  WELL_Y_DIM,
  DIAMETER,
  DEPTH,
  TOTAL_LENGTH,
  MM,
} from '../../localization'
import { LabeledValueTable, LowercaseText } from '../ui'
import { getMeasurementDiagram } from '../measurement-guide'

import type { LabwareWellGroupProperties, LabwareParameters } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

export type WellDimensionsProps = {|
  labwareParams: LabwareParameters,
  wellProperties: LabwareWellGroupProperties,
  wellLabel: string,
  category: string,
  labelSuffix?: string,
  className?: string,
|}

export function WellDimensions(props: WellDimensionsProps) {
  const {
    labwareParams,
    wellProperties,
    wellLabel,
    labelSuffix,
    className,
    category,
  } = props
  const {
    shape,
    depth,
    metadata: { wellBottomShape },
  } = wellProperties
  const { isTiprack, tipLength } = labwareParams
  const dimensions = []

  if (isTiprack && tipLength) {
    dimensions.push({ label: TOTAL_LENGTH, value: toFixed(tipLength) })
  } else if (depth) {
    dimensions.push({ label: DEPTH, value: toFixed(depth) })
  }

  if (shape) {
    if (shape.shape === 'circular') {
      dimensions.push({ label: DIAMETER, value: toFixed(shape.diameter) })
    } else if (shape.shape === 'rectangular') {
      dimensions.push(
        { label: WELL_X_DIM, value: toFixed(shape.xDimension) },
        { label: WELL_Y_DIM, value: toFixed(shape.yDimension) }
      )
    }
  }

  const diagram = getMeasurementDiagram({
    category: category,
    guideType: 'measurements',
    shape: shape?.shape,
    wellBottomShape: wellBottomShape,
  }).map((src, index) => <img src={src} key={index} />)

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {wellLabel} {MEASUREMENTS} <LowercaseText>({MM})</LowercaseText>{' '}
          {labelSuffix || ''}
        </>
      }
      values={dimensions}
      diagram={diagram}
    />
  )
}
