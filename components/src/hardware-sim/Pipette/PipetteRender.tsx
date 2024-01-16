import * as React from 'react'
import classNames from 'classnames'
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
  NINETY_SIX_CHANNEL_PIPETTE_WIDTH,
} from './constants'
import { EmanatingNozzle } from './EmanatingNozzle'
import { EightEmanatingNozzles } from './EightEmanatingNozzles'
import styles from './styles.css'

interface PipetteRenderProps {
  labwareDef: LabwareDefinition2
  pipetteName: PipetteName
  usingMetalProbe?: boolean
}

export const PipetteRender = (props: PipetteRenderProps): JSX.Element => {
  const { labwareDef, pipetteName, usingMetalProbe = false } = props
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

  let boxWidth
  let probeOffsetX = 0
  let probeOffsetY = 0
  if (channels === 1) {
    boxWidth = SINGLE_CHANNEL_PIPETTE_WIDTH
  } else if (channels === 8) {
    boxWidth = MULTI_CHANNEL_PIPETTE_WIDTH
    probeOffsetY = 63
  } else {
    boxWidth = NINETY_SIX_CHANNEL_PIPETTE_WIDTH
    probeOffsetY = 63
    if (Object.keys(labwareDef.wells).length === 1) {
      probeOffsetX = 99 / 2
    }
  }

  return (
    <RobotCoordsForeignDiv
      width={boxWidth}
      height={
        channels === 1
          ? SINGLE_CHANNEL_PIPETTE_HEIGHT
          : MULTI_CHANNEL_PIPETTE_HEIGHT
      }
      x={x - probeOffsetX}
      y={y}
      className={classNames(styles.overflow)}
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
        {channels === 1 || usingMetalProbe ? (
          <EmanatingNozzle
            cx={cx}
            cy={usingMetalProbe ? cy + probeOffsetY : cy}
          />
        ) : (
          <EightEmanatingNozzles
            cx={usingMetalProbe ? cx - probeOffsetX : cx}
            initialCy={usingMetalProbe ? cy + probeOffsetY : cy}
          />
        )}
      </svg>
    </RobotCoordsForeignDiv>
  )
}
