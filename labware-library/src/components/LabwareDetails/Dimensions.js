// @flow
// labware dimensions for details page
import * as React from 'react'
import round from 'lodash/round'

import { LABWARE, MM, X_DIM, Y_DIM, Z_DIM } from '../../localization'
import styles from './styles.css'

import { LabeledValueTable, LowercaseText } from '../ui'

import type { LabwareDefinition } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

export type DimensionsProps = {
  definition: LabwareDefinition,
}

export default function Dimensions(props: DimensionsProps) {
  const { definition } = props
  const { xDimension, yDimension, zDimension } = definition.dimensions
  const dimensions = [
    { label: X_DIM, value: toFixed(xDimension) },
    { label: Y_DIM, value: toFixed(yDimension) },
    { label: Z_DIM, value: toFixed(zDimension) },
  ]

  return (
    <LabeledValueTable
      className={styles.dimensions}
      label={
        <>
          {LABWARE} <LowercaseText>({MM})</LowercaseText>
        </>
      }
      values={dimensions}
    />
  )
}
