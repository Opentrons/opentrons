import styles from '../tipselectionwizard.module.css'

import type { ReactNode } from 'react'
import type { PipetteShadowProps } from '../types'

export function NinetySixChannelFlexShadow(
  props: PipetteShadowProps
): ReactNode {
  const { x, y, width, height, fill, stroke, rotate } = props
  const transform = rotate
    ? `rotate(180, ${x + width / 2}, ${y + height / 2})`
    : ``
  return (
    <svg
      viewBox="0 0 499 341"
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      className={styles.shadow_overlay}
      transform={transform}
      stroke={stroke}
      strokeWidth="2.7881"
    >
      <path d="M2.09766 1.76855H497.548V292.577C497.548 318.07 476.882 338.737 451.388 338.737H48.2576C22.7642 338.737 2.09766 318.07 2.09766 292.577V1.76855Z" />
    </svg>
  )
}
