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
    </g>
  )
}
