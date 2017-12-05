import React from 'react'

import { SLOTNAME_MATRIX, DECK_WIDTH, DECK_HEIGHT, SLOT_WIDTH, SLOT_HEIGHT, SLOT_SPACING } from '../constants.js'
// import styles from '../css/style.css'

import LabwareContainer from '../containers/LabwareContainer.js'

export default function Deck (props) {
  return (
    // <div className={styles.deck}>
    // TODO css not inline style on svg
    <svg viewBox={`0 0 ${DECK_WIDTH} ${DECK_HEIGHT}`} style={{maxHeight: '55vw'}}>
      {/* Deck rect */}
      <rect x='0' y='0' width='100%' height='100%' fill='transparent' stroke='black' />

      {/* All containers */}
      {SLOTNAME_MATRIX.reduce((acc, slotRow, row) => {
        slotRow.forEach((slotName, col) =>
          acc.push(
            <g key={slotName}
              transform={`translate(${
                SLOT_WIDTH * col + SLOT_SPACING * (col + 1)}, ${
                SLOT_HEIGHT * row + SLOT_SPACING * (row + 1)})`}
            >
              <LabwareContainer slotName={slotName} width={SLOT_WIDTH} height={SLOT_HEIGHT} />
            </g>
          )
        )
        return acc
      }, [])}

    </svg>
    // {/* </div> */}
  )
}
