import * as React from 'react'
import { C_SELECTED_DARK } from '../../styles'
import {
  SINGLE_CHANNEL_PIPETTE_WIDTH,
  SINGLE_CHANNEL_PIPETTE_HEIGHT,
} from './constants'

export const EmanatingNozzle = (props: {
  cx: number
  cy: number
}): JSX.Element => {
  const { cx, cy } = props
  console.log('should not be in here')
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
