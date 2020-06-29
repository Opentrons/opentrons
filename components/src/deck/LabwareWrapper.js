// @flow
// TODO(mc, 2020-02-19): no longer used; remove
import { SLOT_RENDER_HEIGHT, SLOT_RENDER_WIDTH } from '@opentrons/shared-data'
import * as React from 'react'

import styles from './LabwareWrapper.css'

const defs = { roundSlotClipPath: 'roundSlotClipPath' } // TODO: import these defs instead of hard-coding in applications? Or should they be passed to children?

export type LabwareWrapperProps = {|
  x?: number,
  y?: number,
  height?: number,
  width?: number,
  highlighted?: boolean,
  children?: React.Node,
|}

/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export function LabwareWrapper(props: LabwareWrapperProps): React.Node {
  const { x, y, highlighted, children } = props
  const height = props.height || SLOT_RENDER_HEIGHT
  const width = props.width || SLOT_RENDER_WIDTH

  return (
    <g>
      <svg {...{ x, y, height, width }} className={styles.deck_slot}>
        {/* Defs for anything inside this SVG. TODO: how to better organize IDs and defined elements? */}
        <defs>
          <clipPath id={defs.roundSlotClipPath}>
            <rect rx="6" width="100%" height="100%" />
          </clipPath>
        </defs>
        {children}
      </svg>
      {/* Highlight border goes outside the SVG so it doesn't get clipped... */}
      {highlighted && (
        <rect
          className={styles.highlighted}
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          rx="6"
        />
      )}
    </g>
  )
}
