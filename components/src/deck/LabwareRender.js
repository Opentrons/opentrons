// @flow
// standalone render of RobotLabware component
import * as React from 'react'

import {
  SLOT_RENDER_WIDTH,
  SLOT_RENDER_HEIGHT,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import RobotLabware from './RobotLabware'
import styles from './labwareRender.css'

type Props = {
  /** A labware definition object (eg from shared-data) to render */
  definition: LabwareDefinition2,
}

export default function LabwareRender(props: Props) {
  // SVG coordinate system is flipped in Y from our definitions
  const transform = `translate(0,${SLOT_RENDER_HEIGHT}) scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`

  return (
    <svg className={styles.labware_render} viewBox={viewBox}>
      <RobotLabware transform={transform} definition={props.definition} />
    </svg>
  )
}
