// @flow
import * as React from 'react'
import cx from 'classnames'
import flatMap from 'lodash/flatMap'
import type {DeckSlot} from '../robot-types'

import {
  SLOTNAME_MATRIX,
  SLOT_WIDTH,
  SLOT_HEIGHT,
  SLOT_SPACING,
  SLOT_OFFSET,
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
      <g transform={`translate(${SLOT_OFFSET} ${SLOT_OFFSET})`}>
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

        const props = {slot, width: SLOT_WIDTH, height: SLOT_HEIGHT}
        const transform = `translate(${[
          SLOT_WIDTH * col + SLOT_SPACING * (col + 1),
          SLOT_HEIGHT * row + SLOT_SPACING * (row + 1)
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
