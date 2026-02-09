import { COLORS } from '../../../../helix-design-system'
import { DEFAULT_TIP_SIZE } from '../Tips/constants'
import styles from './wells.module.css'

export function SelectedWell(props: {
  size?: string
  textInsideTip?: string
  isUsed?: boolean
  isError?: boolean
  isSelected?: boolean
  showStroke?: boolean
}): JSX.Element {
  const {
    size,
    textInsideTip,
    isUsed = false,
    isError = false,
    isSelected = true,
    showStroke,
  } = props
  const width = size ?? DEFAULT_TIP_SIZE
  const height = size ?? DEFAULT_TIP_SIZE
  const getFillColor = (
    isSelected: boolean,
    isError: boolean,
    isUsed: boolean
  ): string => {
    if (isError) {
      return COLORS.red50
    }
    if (isUsed) {
      return COLORS.yellow50
    }
    if (isSelected) {
      return COLORS.blue50
    }
    return COLORS.blue35
  }

  const shouldShowStroke = textInsideTip == null && showStroke
  // TODO (nd: 10/16/25): create a "Nozzle" component wrapping SelectedTip to avoid this flakey logic
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10"
        cy="10"
        r={shouldShowStroke ? '9' : '10'}
        fill={getFillColor(isSelected, isError, isUsed)}
        stroke={shouldShowStroke ? COLORS.black90 : undefined}
        strokeWidth={shouldShowStroke ? '2' : undefined}
      />
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
