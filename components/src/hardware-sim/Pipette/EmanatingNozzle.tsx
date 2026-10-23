import { Fragment } from 'react'

import { COLORS } from '../../helix-design-system'
import { C_TRANSPARENT } from '../../styles'
import { SINGLE_CHANNEL_PIPETTE_HEIGHT } from './constants'

import type { ReactNode } from 'react'

export const EmanatingNozzle = (props: {
  cx: number
  cy: number
}): ReactNode => {
  const { cx, cy } = props
  return (
    <Fragment>
      <circle
        data-testid="origin_circle"
        cx={cx}
        cy={cy}
        r={0.5}
        stroke={COLORS.blue50}
        fill={COLORS.blue50}
      ></circle>
      <circle
        data-testid="emanating_circle"
        cx={cx}
        cy={cy}
        r={0.5}
        stroke={COLORS.blue50}
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
    </Fragment>
  )
}
