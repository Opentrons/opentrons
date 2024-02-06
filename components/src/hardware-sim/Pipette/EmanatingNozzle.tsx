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
      </circle>
    </React.Fragment>
  )
}
