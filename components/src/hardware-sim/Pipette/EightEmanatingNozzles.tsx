import * as React from 'react'
import { EmanatingNozzle } from './EmanatingNozzle'

export const EightEmanatingNozzles = (props: {
  cx: number
  initialCy: number
}): JSX.Element => {
  const { cx, initialCy } = props
  const MULTI_CHANNEL_NOZZLE_SPACING = 9
  return (
    <React.Fragment>
      {[...Array(8)].map((_, i: number) => {
        return (
          <EmanatingNozzle
            cx={cx}
            cy={initialCy + i * MULTI_CHANNEL_NOZZLE_SPACING}
            key={`Circle_${i}`}
          />
        )
      })}
    </React.Fragment>
  )
}
