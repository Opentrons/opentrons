// @flow
import * as React from 'react'
import cx from 'classnames'
import flatMap from 'lodash/flatMap'
import type {DeckSlot} from '../robot-types'

import {
  SLOTNAME_MATRIX,
  SLOT_WIDTH_MM,
  SLOT_HEIGHT_MM,
  SLOT_SPACING_MM,
  SLOT_OFFSET_MM,
  TRASH_SLOTNAME
} from './constants'
import DeckOutline from './DeckOutline'
import {EmptyDeckSlot} from './EmptyDeckSlot'

import styles from './Deck.css'

export type LabwareComponentProps = {
  slot: DeckSlot,
  width: number,
  height: number
}

type Props = {
  className?: string,
  LabwareComponent?: React.ComponentType<LabwareComponentProps>
}

export default function Deck (props: Props) {
  const {className, LabwareComponent} = props

  return (
    // TODO(mc, 2018-07-16): is this viewBox in mm?
    <svg viewBox={'0 0 427 390'} className={cx(styles.deck, className)}>
      <DeckOutline />
      {/* All containers */}
      <g transform={`translate(${SLOT_OFFSET_MM} ${SLOT_OFFSET_MM})`}>
        {renderLabware(LabwareComponent)}
      </g>
    </svg>
  )
}

function renderLabware (LabwareComponent): React.Node[] {
  return flatMap(
    SLOTNAME_MATRIX,
    (columns: Array<DeckSlot>, row: number): React.Node[] => {
      return columns.map((slot: DeckSlot, col: number) => {
        if (slot === TRASH_SLOTNAME) return null

        const props = {slot, width: SLOT_WIDTH_MM, height: SLOT_HEIGHT_MM}
        const transform = `translate(${[
          SLOT_WIDTH_MM * col + SLOT_SPACING_MM * (col + 1),
          SLOT_HEIGHT_MM * row + SLOT_SPACING_MM * (row + 1)
        ].join(',')})`

        return (
          <g key={slot} transform={transform}>
            <EmptyDeckSlot {...props} />
            {LabwareComponent && (
              <LabwareComponent {...props} />
            )}
          </g>
        )
      })
    })
}
