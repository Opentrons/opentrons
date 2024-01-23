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
          data-testid="radius_animation"
          attributeName="r"
          from={5}
          to={SINGLE_CHANNEL_PIPETTE_HEIGHT / 2}
          begin={0}
          dur={1.1}
          calcMode="ease-out"
          repeatCount="indefinite"
        />
        <animate
          data-testid="opacity_animation"
          attributeName="opacity"
          from={0.7}
          to={0}
          begin={0}
          dur={1.1}
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
    </React.Fragment>
  )
}
