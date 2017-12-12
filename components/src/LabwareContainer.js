import React from 'react'
import styles from './LabwareContainer.css'

export const defs = {roundSlotClipPath: 'roundSlotClipPath'} // TODO: import these defs instead of hard-coding in applications?

export function LabwareContainer ({height, width, highlighted, children}) {
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
        <rect className={styles.highlighted} x='0' y='0' width={width} height={height} rx='6' />}
    </g>
  )
}
