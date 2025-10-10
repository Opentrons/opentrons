import { COLORS } from '@opentrons/components'

import styles from '../tipselectionwizard.module.css'

export function NinetySixFlexShadow(props: {
  x: number
  y: number
  width: number
  height: number
}): JSX.Element {
  const { x, y, width, height } = props
  return (
    <svg
      width={width}
      height={height}
      x={x}
      y={y}
      viewBox="0 0 499 341"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.shadow_overlay}
    >
      <path
        d="M2.09863 338.737H497.549V48.9296C497.549 23.4361 476.883 2.76959 451.389 2.76959H48.2586C22.7651 2.76959 2.09863 23.4361 2.09863 48.9296V338.737Z"
        fill="#16212D"
        fill-opacity="0.2"
        stroke={COLORS.blue50}
        stroke-width="2.5"
      />
    </svg>
  )
}
