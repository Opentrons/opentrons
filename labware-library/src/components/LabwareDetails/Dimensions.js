// @flow
// labware dimensions for details page
import * as React from 'react'
import round from 'lodash/round'
import {
  FOOTPRINT,
  MM,
  LABWARE_X_DIM,
  LABWARE_Y_DIM,
  LABWARE_Z_DIM,
} from '../../localization'
import { LabeledValueTable, LowercaseText } from '../ui'
import { getFootprintDiagram } from '../measurement-guide'

import type { LabwareDefinition } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

export type DimensionsProps = {|
  definition: LabwareDefinition,
  className?: string,
  irregular?: boolean,
  insertCategory?: string,
|}

export function Dimensions(props: DimensionsProps) {
  const { definition, className, irregular, insertCategory } = props
  const { displayCategory } = definition.metadata
  const { xDimension, yDimension, zDimension } = definition.dimensions
  const dimensions = [
    { label: LABWARE_X_DIM, value: toFixed(xDimension) },
    { label: LABWARE_Y_DIM, value: toFixed(yDimension) },
    { label: LABWARE_Z_DIM, value: toFixed(zDimension) },
  ]

  const diagram = getFootprintDiagram({
    category: displayCategory,
    guideType: FOOTPRINT,
    insertCategory: insertCategory,
    irregular: irregular,
  }).map((src, index) => <img src={src} key={index} />)

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {FOOTPRINT} <LowercaseText>({MM})</LowercaseText>
        </>
      }
      values={dimensions}
      diagram={diagram}
    />
  )
}
