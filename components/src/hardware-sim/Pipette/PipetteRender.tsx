import * as React from 'react'
import classNames from 'classnames'
import {
  getPipetteNameSpecs,
  LabwareDefinition2,
  PipetteName,
} from '@opentrons/shared-data'
import { C_MED_GRAY, C_SELECTED_DARK } from '../../styles'
import { RobotCoordsForeignDiv } from '../Deck/RobotCoordsForeignDiv'
import styles from './styles.css'

const SINGLE_CHANNEL_PIPETTE_WIDTH = 18
const SINGLE_CHANNEL_PIPETTE_HEIGHT = 30

const MULTI_CHANNEL_PIPETTE_WIDTH = 18
const MULTI_CHANNEL_PIPETTE_HEIGHT = 90

interface PipetteRenderProps {
  labwareDef: LabwareDefinition2
  pipetteName: PipetteName
}

const Circles = (props: { cx: number; cy: number }): JSX.Element => {
  const { cx, cy } = props
  return (
    <React.Fragment>
      <circle
        cx={cx}
        cy={cy}
        r={1.5}
        stroke={C_SELECTED_DARK}
        fill={C_SELECTED_DARK}
      ></circle>
      <circle
        cx={cx}
        cy={cy}
        r={3}
        stroke={C_SELECTED_DARK}
        strokeWidth={'2px'}
        fill={'transparent'}
      >
        <animate
          attributeName="r"
          from={3}
          to={
            Math.max(
              SINGLE_CHANNEL_PIPETTE_WIDTH,
              SINGLE_CHANNEL_PIPETTE_HEIGHT
            ) / 2
          }
          begin={0}
          dur={3}
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from={1}
          to={0}
          begin={0}
          dur={3}
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
    </React.Fragment>
  )
}

const MultiChannelCircles = (props: {
  cx: number
  cy: number
}): JSX.Element => {
  const { cx, cy } = props
  const MULTI_CHANNEL_NOZZLE_SPACING = 9
  return (
    <React.Fragment>
      {[...Array(8)].map((_, i: number) => {
        return (
          <Circles
            cx={cx}
            cy={cy + i * MULTI_CHANNEL_NOZZLE_SPACING}
            key={`Circle_${i}`}
          />
        )
      })}
    </React.Fragment>
  )
}

export const PipetteRender = (props: PipetteRenderProps): JSX.Element => {
  const { labwareDef, pipetteName } = props
  const channels = getPipetteNameSpecs(pipetteName)?.channels
  const cx =
    channels === 1
      ? SINGLE_CHANNEL_PIPETTE_WIDTH / 2
      : MULTI_CHANNEL_PIPETTE_WIDTH / 2
  const cy = channels === 1 ? SINGLE_CHANNEL_PIPETTE_HEIGHT / 2 : 14
  const x = labwareDef.wells.A1.x - cx
  const y = channels === 1 ? labwareDef.wells.A1.y - cy : -2

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
      className={classNames(styles.overflow)}
      innerDivProps={{
        borderRadius: '6px',
        backgroundColor: `${C_MED_GRAY}80`,
        width: '100%',
        height: '100%',
      }}
    >
      <svg overflow="visible">
        {channels === 1 ? (
          <Circles cx={cx} cy={cy} />
        ) : (
          <MultiChannelCircles cx={cx} cy={cy} />
        )}
      </svg>
    </RobotCoordsForeignDiv>
  )
}
