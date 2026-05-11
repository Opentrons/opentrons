import { INTERACTIVE_WELL_DATA_ATTRIBUTE } from '@opentrons/shared-data'

import { COLORS } from '../../../../helix-design-system'
import { getWidthAndHeightOfWellSVG } from './utils'
import styles from './wells.module.css'

import type { LabwareWellMap } from '@opentrons/shared-data'

interface SelectedWellProps {
  wellMap: LabwareWellMap
  wellName: string
  size: string
  textInsideTip?: string
  isUsed?: boolean
  isError?: boolean
  isSelected?: boolean
  showStroke?: boolean
}
export function SelectedWell(props: SelectedWellProps): JSX.Element {
  const {
    wellMap,
    wellName,
    size,
    textInsideTip,
    isUsed = false,
    isError = false,
    isSelected = true,
    showStroke,
  } = props

  const firstWell = wellMap.A1
  const isWellCircular = firstWell.shape === 'circular'
  const [width, height] = getWidthAndHeightOfWellSVG(wellMap)
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
  const viewBox = isWellCircular ? '0 0 20 20' : `0 0 ${width} ${height}`
  const commonProps = {
    [INTERACTIVE_WELL_DATA_ATTRIBUTE]: wellName,
  }

  return (
    <svg
      width={!isWellCircular ? width : size}
      height={!isWellCircular ? height : size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isWellCircular ? (
        <circle
          cx="10"
          cy="10"
          {...commonProps}
          r={shouldShowStroke ? 9 : 10}
          fill={getFillColor(isSelected, isError, isUsed)}
          stroke={shouldShowStroke ? COLORS.black90 : undefined}
          strokeWidth={shouldShowStroke ? 2 : undefined}
        />
      ) : (
        <rect
          x={shouldShowStroke ? 1 : 0}
          y={shouldShowStroke ? 1 : 0}
          width={width}
          height={height}
          {...commonProps}
          fill={getFillColor(isSelected, isError, isUsed)}
          stroke={shouldShowStroke ? COLORS.black90 : undefined}
          strokeWidth={shouldShowStroke ? 2 : undefined}
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
          className={styles.selected_tip_text}
        >
          {textInsideTip}
        </text>
      ) : null}
    </svg>
  )
}
