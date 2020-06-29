// @flow
import { SLOT_RENDER_HEIGHT, SLOT_RENDER_WIDTH } from '@opentrons/shared-data'
import * as React from 'react'

import styles from './Labware.css'
import { LabwareOutline } from './LabwareOutline'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'

// TODO: BC 2019-06-18 remove when old Labware component is no longer used anywhere
/**
 * @deprecated No longer necessary, do not use
 */
export function FallbackLabware(): React.Node {
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
