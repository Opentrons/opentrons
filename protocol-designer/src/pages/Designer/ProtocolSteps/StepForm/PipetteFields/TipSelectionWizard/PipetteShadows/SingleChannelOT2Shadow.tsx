import styles from '../tipselectionwizard.module.css'

import type { ReactNode } from 'react'
import type { PipetteShadowProps } from '../types'

export function SingleChannelOT2Shadow(props: PipetteShadowProps): ReactNode {
  const { x, y, width, height, fill, stroke } = props

  return (
    <svg
      viewBox="0 0 99 137"
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      className={styles.shadow_overlay}
      stroke={stroke}
      strokeWidth="2.79089"
    >
      <rect
        x="1.395"
        y="1.395"
        width="95.6715"
        height="134.133"
        rx="10.9127"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.79"
      />
    </svg>
  )
}
