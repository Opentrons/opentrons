// @flow
import * as React from 'react'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import LabwareOutline from './LabwareOutline'
import styles from './Labware.css'
import RobotCoordsForeignDiv from './RobotCoordsForeignDiv'

export default function FallbackLabware() {
  return (
    <g>
      <LabwareOutline />
      <RobotCoordsForeignDiv
        width={SLOT_RENDER_WIDTH}
        height={SLOT_RENDER_HEIGHT}
        x={0}
        y={-SLOT_RENDER_HEIGHT}
        transformWithSVG
        innerDivProps={{
          className: styles.fallback_plate_text,
        }}
      >
        Custom Labware
      </RobotCoordsForeignDiv>
    </g>
  )
}
