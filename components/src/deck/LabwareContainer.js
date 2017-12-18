// @flow
import * as React from 'react'
import styles from './LabwareContainer.css'

import type {DeckSlotProps} from '../../interfaces/DeckSlot'
const defs = {roundSlotClipPath: 'roundSlotClipPath'} // TODO: import these defs instead of hard-coding in applications? Or should they be passed to children?

export function LabwareContainer (props: DeckSlotProps) {
  const { height, width, highlighted, children } = props
  return (
    <g>
      <svg {...{height, width}} className={styles.deck_slot}>
        {/* Defs for anything inside this SVG. TODO: how to better organize IDs and defined elements? */}
        <defs>
          <clipPath id={defs.roundSlotClipPath}>
            <rect rx='6' width='100%' height='100%' />
          </clipPath>
        </defs>
        {children}
      </svg>
      {/* Highlight border goes outside the SVG so it doesn't get clipped... */}
      {highlighted &&
        <rect className={styles.highlighted}
          x='0.5' y='0.5' width={width - 1} height={height - 1} rx='6' />}
    </g>
  )
}
