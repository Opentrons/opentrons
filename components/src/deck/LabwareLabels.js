// @flow
import * as React from 'react'
import cx from 'classnames'
import uniq from 'lodash/uniq'
import {getWellDefsForSVG, wellIsRect} from '@opentrons/shared-data'
import {wellNameSplit} from '../utils'
import styles from './LabwareLabels.css'

type Props = {labwareType: string}
const ROW_OFFSET = -4
const COLUMN_OFFSET = -4

export default function LabwareLabels (props: Props) {
  const {labwareType} = props
  const allWells = getWellDefsForSVG(labwareType)

  if (!allWells) {
    console.warn(`Could not get wells for labware type ${labwareType}`)
    return null
  }
  const allWellNames = Object.keys(allWells)
  const allWellsSplit = allWellNames.map(wellNameSplit)

  // NOTE: can definitely be optimized
  const rowLetters = uniq(allWellsSplit.map(([letters, numbers]) => letters)).sort()
  const colNumbers = uniq(allWellsSplit.map(([letters, numbers]) => numbers))
    .sort((a, b) => Number(a) - Number(b))

  const rowLabels = rowLetters.map(letter => {
    const relativeWell = allWells[letter + '1']
    const rectOffset = wellIsRect(relativeWell) ? relativeWell.length / 2 : 0
    return (
      <text key={letter}
        x={ROW_OFFSET}
        y={relativeWell.y - rectOffset}
        className={cx(styles.plate_label, {[styles.tiny_labels]: rowLetters.length > 8})}>
        {letter}
      </text>
    )
  })

  const colLabels = colNumbers.map(number => {
    const relativeWell = allWells['A' + number]
    const rectOffset = wellIsRect(relativeWell)
      ? relativeWell.width / 2
      : 0
    return (
      <text key={number}
        x={relativeWell.x + rectOffset}
        y={COLUMN_OFFSET}
        className={cx(styles.plate_label, {[styles.tiny_labels]: colNumbers.length > 12})}>
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
