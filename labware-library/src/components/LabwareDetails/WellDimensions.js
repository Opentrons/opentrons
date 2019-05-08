// @flow
// well dimensions and spacing for details page
import * as React from 'react'
import round from 'lodash/round'

import {
  WELL_TYPE_BY_CATEGORY,
  MAX_VOLUME,
  SPACING,
  MM,
  X_DIM,
  Y_DIM,
  X_OFFSET,
  Y_OFFSET,
  X_SPACING,
  Y_SPACING,
  DEPTH,
  DIAMETER,
  SHAPE,
} from '../../localization'

import { getDisplayVolume } from '@opentrons/shared-data'
import { getUniqueWellProperties } from '../../definitions'
import styles from './styles.css'

import {
  LabeledValueTable,
  TableEntry,
  LabelText,
  Value,
  LowercaseText,
  LABEL_LEFT,
} from '../ui'

import type { LabwareDefinition } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

const spacingValue = (spacing: number) =>
  spacing ? toFixed(spacing) : <span className={styles.lighter}>N/A</span>

export type WellDimensionsProps = {
  definition: LabwareDefinition,
}

export default function WellDimensions(props: WellDimensionsProps) {
  const { definition } = props
  const { displayCategory, displayVolumeUnits } = definition.metadata
  const wellProps = getUniqueWellProperties(definition)
  const wellType =
    WELL_TYPE_BY_CATEGORY[displayCategory] || WELL_TYPE_BY_CATEGORY.other

  return (
    <div className={styles.well_dimensions_container}>
      {wellProps.map((w, i) => {
        const vol = getDisplayVolume(w.totalLiquidVolume, displayVolumeUnits, 2)

        const dimensions = [
          { label: DEPTH, value: toFixed(w.depth) },
          w.diameter != null
            ? { label: DIAMETER, value: toFixed(w.diameter) }
            : null,
          w.xDimension != null
            ? { label: X_DIM, value: toFixed(w.xDimension) }
            : null,
          w.yDimension != null
            ? { label: Y_DIM, value: toFixed(w.yDimension) }
            : null,
          // TODO(mc, 2019-04-15): change label to icon
          { label: SHAPE, value: w.shape },
        ].filter(Boolean)

        const spacing = [
          { label: X_OFFSET, value: toFixed(w.xOffset) },
          { label: Y_OFFSET, value: toFixed(w.yOffset) },
          { label: X_SPACING, value: spacingValue(w.xSpacing) },
          { label: Y_SPACING, value: spacingValue(w.ySpacing) },
        ]

        return (
          <div key={i} className={styles.well_dimensions_row}>
            <LabeledValueTable
              className={styles.well_dimensions}
              label={
                <>
                  {wellType} <LowercaseText>({MM})</LowercaseText>
                </>
              }
              values={dimensions}
            >
              <div className={styles.well_volume}>
                <TableEntry>
                  <LabelText position={LABEL_LEFT}>{MAX_VOLUME}</LabelText>
                  <Value>
                    {vol} {displayVolumeUnits}
                  </Value>
                </TableEntry>
              </div>
            </LabeledValueTable>
            <LabeledValueTable
              className={styles.well_dimensions}
              label={
                <>
                  {SPACING} <LowercaseText>({MM})</LowercaseText>
                </>
              }
              values={spacing}
            />
          </div>
        )
      })}
    </div>
  )
}
