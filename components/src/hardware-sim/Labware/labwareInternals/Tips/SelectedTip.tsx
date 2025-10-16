import { COLORS } from '../../../../helix-design-system'
import { DEFAULT_TIP_SIZE } from './constants'
import styles from './tips.module.css'

export function SelectedTip(props: {
  size?: string
  textInsideTip?: string
  isUsed?: boolean
}): JSX.Element {
  const { size, textInsideTip, isUsed = false } = props
  const width = size ?? DEFAULT_TIP_SIZE
  const height = size ?? DEFAULT_TIP_SIZE
  const fill = isUsed ? COLORS.yellow50 : COLORS.blue50
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill={fill} />
      {textInsideTip != null ? (
        <text
          x="10"
          y="11"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.white}
          transform="scale(1, -1)"
          // needed to refactor `transform-origin` to CSS modules for passing lint checks
          className={styles.selected_tip_text}
        >
          {textInsideTip}
        </text>
      ) : null}
    </svg>
  )
}
