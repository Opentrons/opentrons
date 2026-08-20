import styles from '../tipselectionwizard.module.css'

import type { ReactNode } from 'react'
import type { PipetteShadowProps } from '../types'

export function SingleChannelFlexShadow(
  props: PipetteShadowProps
): ReactNode {
  const { x, y, width, height, fill, stroke } = props
  return (
    <svg
      viewBox="0 0 158 201"
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      className={styles.shadow_overlay}
      transform={`rotate(180, ${x + width / 2}, ${y + height / 2})`}
      stroke={stroke}
      strokeWidth="2.79089"
    >
      <path d="M2 5.38963C2 3.69017 3.37768 2.3125 5.07714 2.3125H152.78C154.479 2.3125 155.857 3.69018 155.857 5.38964V199.249H2V5.38963Z" />
    </svg>
  )
}
