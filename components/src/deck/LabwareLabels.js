// @flow
// TODO(mc, 2020-02-19): no longer used; remove
import * as React from 'react'
import cx from 'classnames'
import uniq from 'lodash/uniq'
import {
  getLabwareV1Def,
  getWellPropsForSVGLabwareV1,
  wellIsRect,
} from '@opentrons/shared-data'
import { wellNameSplit } from '../utils'
import styles from './LabwareLabels.css'

export type LabwareLabelsProps = {| labwareType: string |}

const ROW_OFFSET = -4
const COLUMN_OFFSET = -4

/**
 * @deprecated No longer necessary, do not use
 */
export function LabwareLabels(props: LabwareLabelsProps) {
  const { labwareType } = props
  const labwareDef = getLabwareV1Def(labwareType)
  if (!labwareDef) {
    console.warn(`Could not get wells for labware type ${labwareType}`)
    return null
  }
  const allWells = getWellPropsForSVGLabwareV1(labwareDef)
  const allWellNames = Object.keys(allWells)
  const allWellsSplit = allWellNames.map(wellNameSplit)

  // NOTE: can definitely be optimized
  const rowLetters = uniq(
    allWellsSplit.map(([letters, numbers]) => letters)
  ).sort()
  const colNumbers = uniq(
    allWellsSplit.map(([letters, numbers]) => numbers)
  ).sort((a, b) => Number(a) - Number(b))

  const rowLabels = rowLetters.map(letter => {
    const relativeWell = allWells[letter + '1']
    const rectOffset = wellIsRect(relativeWell) ? relativeWell.length / 2 : 0
    return (
      <text
        key={letter}
        x={ROW_OFFSET}
        y={relativeWell.y - rectOffset}
        className={cx(styles.plate_label, {
          [styles.tiny_labels]: rowLetters.length > 8,
        })}
      >
        {letter}
      </text>
    )
  })

  const colLabels = colNumbers.map(number => {
    const relativeWell = allWells['A' + number]
    const rectOffset = wellIsRect(relativeWell) ? relativeWell.width / 2 : 0
    return (
      <text
        key={number}
        x={relativeWell.x + rectOffset}
        y={COLUMN_OFFSET}
        className={cx(styles.plate_label, {
          [styles.tiny_labels]: colNumbers.length > 12,
        })}
      >
        {number}
      </text>
    )
  })

  return (
    <g>
      {rowLabels}
      {colLabels}
    </g>
  )
}
