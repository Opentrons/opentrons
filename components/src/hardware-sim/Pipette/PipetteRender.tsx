import * as React from 'react'
import {
  getPipetteNameSpecs,
  LabwareDefinition2,
  PipetteName,
} from '@opentrons/shared-data'
import { C_MED_DARK_GRAY, C_MED_GRAY } from '../../styles'
import { RobotCoordsForeignDiv } from '../Deck/RobotCoordsForeignDiv'
import {
  MULTI_CHANNEL_PIPETTE_WIDTH,
  SINGLE_CHANNEL_PIPETTE_WIDTH,
  SINGLE_CHANNEL_PIPETTE_HEIGHT,
  MULTI_CHANNEL_PIPETTE_HEIGHT,
  MULTI_CHANNEL_CENTER_Y_NOZZLE,
  MULTI_CHANNEL_Y_OFFSET,
} from './constants'
import { EmanatingNozzle } from './EmanatingNozzle'
import { EightEmanatingNozzles } from './EightEmanatingNozzles'

interface PipetteRenderProps {
  labwareDef: LabwareDefinition2
  pipetteName: PipetteName
}

export const PipetteRender = (props: PipetteRenderProps): JSX.Element => {
  const { labwareDef, pipetteName } = props
  const channels = getPipetteNameSpecs(pipetteName)?.channels
  const cx =
    channels === 1
      ? SINGLE_CHANNEL_PIPETTE_WIDTH / 2
      : MULTI_CHANNEL_PIPETTE_WIDTH / 2
  const cy =
    channels === 1
      ? SINGLE_CHANNEL_PIPETTE_HEIGHT / 2
      : MULTI_CHANNEL_CENTER_Y_NOZZLE
  const x = labwareDef.wells.A1.x - cx
  const y = channels === 1 ? labwareDef.wells.A1.y - cy : MULTI_CHANNEL_Y_OFFSET

  return (
    <RobotCoordsForeignDiv
      width={
        channels === 1
          ? SINGLE_CHANNEL_PIPETTE_WIDTH
          : MULTI_CHANNEL_PIPETTE_WIDTH
      }
      height={
        channels === 1
          ? SINGLE_CHANNEL_PIPETTE_HEIGHT
          : MULTI_CHANNEL_PIPETTE_HEIGHT
      }
      x={x}
      y={y}
      outerProps={{ style: { overflow: 'visible' } }}
      innerDivProps={{
        style: {
          width: '100%',
          height: '100%',
          overflow: 'visible',
          boxSizing: 'border-box',
          borderRadius: '4px',
          boxShadow: `inset 0 0 0 1px ${C_MED_DARK_GRAY}`,
          backgroundColor: `${C_MED_GRAY}80`,
        },
      }}
    >
      <svg overflow="visible">
        {channels === 1 ? (
          <EmanatingNozzle cx={cx} cy={cy} />
        ) : (
          <EightEmanatingNozzles cx={cx} initialCy={cy} />
        )}
      </svg>
    </RobotCoordsForeignDiv>
  )
}
