// @flow
// standalone render of robot coordinates SVG elements, framed by a robot slot
import * as React from 'react'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import styles from './SlotView'

type Props = {
  /** children should be SVG elements in robot coordinates */
  children?: React.Node,
  /** optional className, overrides default class */
  className?: ?string,
}
export default function SlotView(props: Props) {
  // SVG coordinate system is flipped in Y from our robot coordinate system.
  // Note that this reflection via scaling happens via CSS on the SVG element,
  // not using `transform` attr on an element inside an SVG, so no translation is needed
  // and the robot X, Y points are preserved.
  const transform = `scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`
  return (
    <svg
      className={props.className || styles.slot_view}
      viewBox={viewBox}
      style={{ transform }}
    >
      {props.children}
    </svg>
  )
}
