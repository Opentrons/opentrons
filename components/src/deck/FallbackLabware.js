// @flow
import * as React from 'react'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import { LabwareOutline } from './LabwareOutline'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'

import styles from './Labware.css'

// TODO: BC 2019-06-18 remove when old Labware component is no longer used anywhere
export function FallbackLabware() {
  return (
    <g>
      <LabwareOutline width={SLOT_RENDER_WIDTH} height={SLOT_RENDER_HEIGHT} />
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
        <p>Custom Labware</p>
      </RobotCoordsForeignDiv>
    </g>
  )
}
