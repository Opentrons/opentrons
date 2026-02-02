import { COLORS } from '../../../helix-design-system'
import styles from './sharedstyles.module.css'
import { DEFAULT_TIP_SIZE } from './Tips/constants'

import type { LabwareDefinition } from '@opentrons/shared-data'

export function SelectedItem(props: {
  labwareDefinition: LabwareDefinition
  textInsideTip?: string
  isUsed?: boolean
  isError?: boolean
  isSelected?: boolean
}): JSX.Element {
  const {
    labwareDefinition,
    textInsideTip,
    isUsed = false,
    isError = false,
    isSelected = true,
  } = props
  const defaultColor = isSelected ? COLORS.blue50 : COLORS.blue35
  const fill = isError ? COLORS.red50 : isUsed ? COLORS.yellow50 : defaultColor

  const firstWell = labwareDefinition.wells
    ? labwareDefinition.wells.A1
    : undefined

  const wellWidth =
    firstWell == null
      ? DEFAULT_TIP_SIZE
      : firstWell.shape === 'circular'
        ? firstWell.diameter
        : firstWell.xDimension

  const wellHeight =
    firstWell == null
      ? DEFAULT_TIP_SIZE
      : firstWell.shape === 'circular'
        ? firstWell.diameter
        : firstWell.yDimension
  // TODO (nd: 10/16/25): create a "Nozzle" component wrapping SelectedTip to avoid this flakey logic
  const showStroke = textInsideTip == null
  const isCircular = firstWell?.shape === 'circular'
  return (
    <svg
      width={wellWidth}
      height={wellHeight}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isCircular ? (
        <circle
          cx="10"
          cy="10"
          r={showStroke ? '9' : '10'}
          fill={fill}
          stroke={showStroke ? COLORS.black90 : undefined}
          strokeWidth={showStroke ? '2' : undefined}
        />
      ) : (
        <rect
          x={showStroke ? 1 : 0}
          y={showStroke ? 1 : 0}
          width={Number(wellWidth) - (showStroke ? 2 : 0)}
          height={Number(wellHeight) - (showStroke ? 2 : 0)}
          fill={fill}
          stroke={showStroke ? COLORS.black90 : undefined}
          strokeWidth={showStroke ? 2 : undefined}
        />
      )}
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
