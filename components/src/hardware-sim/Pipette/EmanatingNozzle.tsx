import * as React from 'react'
import { C_SELECTED_DARK, C_TRANSPARENT } from '../../styles'
import { SINGLE_CHANNEL_PIPETTE_HEIGHT } from './constants'

export const EmanatingNozzle = (props: {
  cx: number
  cy: number
}): JSX.Element => {
  const { cx, cy } = props
  return (
    <React.Fragment>
      <circle
        data-testid="origin_circle"
        cx={cx}
        cy={cy}
        r={0.5}
        stroke={C_SELECTED_DARK}
        fill={C_SELECTED_DARK}
      ></circle>
      <circle
        data-testid="emanating_circle"
        cx={cx}
        cy={cy}
        r={0.5}
        stroke={C_SELECTED_DARK}
        strokeWidth={'2px'}
        fill={C_TRANSPARENT}
      >
        <animate
          data-testid="animation_radius"
          attributeName="r"
          from={0.5}
          to={SINGLE_CHANNEL_PIPETTE_HEIGHT / 2}
          begin={0}
          dur={1.5}
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          data-testid="animation_radius"
          attributeName="opacity"
          from={1}
          to={0}
          begin={0}
          dur={1.5}
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
    </React.Fragment>
  )
}
