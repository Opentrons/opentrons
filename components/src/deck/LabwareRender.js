// @flow
// standalone render of a labware framed by a slot
import * as React from 'react'

import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import RobotLabware from './RobotLabware'
import styles from './labwareRender.css'

type Props = React.ElementProps<typeof RobotLabware>

export default function LabwareRender(props: Props) {
  // SVG coordinate system is flipped in Y from our robot coordinate system.
  // Note that this reflection via scaling happens via CSS on the SVG element,
  // not using `transform` attr on an element inside an SVG, so no translation is needed
  // and the robot X, Y points are preserved.
  const transform = `scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`

  return (
    <svg
      className={styles.labware_render}
      viewBox={viewBox}
      style={{ transform }}
    >
      <RobotLabware definition={props.definition} />
    </svg>
  )
}
