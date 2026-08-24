import { COLORS } from '../../../helix-design-system'

import type { ReactNode } from 'react'

const BORDER_THICKNESS = 10

interface OpentronsVacuumManifoldSpacerProps {
  lidDimensions: {
    xDimension: number
    yDimension: number
    zDimension: number
  } | null
}

export function OpentronsVacuumManifoldSpacer({
  lidDimensions,
}: OpentronsVacuumManifoldSpacerProps): ReactNode {
  const width = lidDimensions?.xDimension ?? 128
  const height = lidDimensions?.yDimension ?? 86

  const innerX = BORDER_THICKNESS
  const innerY = BORDER_THICKNESS
  const innerWidth = width - 2 * BORDER_THICKNESS
  const innerHeight = height - 2 * BORDER_THICKNESS
  const radius = 7

  const outerPath =
    `M ${radius} 0 H ${width - radius} A ${radius} ${radius} 0 0 1 ${width} ${radius} ` +
    `V ${height - radius} A ${radius} ${radius} 0 0 1 ${width - radius} ${height} ` +
    `H ${radius} A ${radius} ${radius} 0 0 1 0 ${height - radius} ` +
    `V ${radius} A ${radius} ${radius} 0 0 1 ${radius} 0 Z`
  const innerPath =
    `M ${innerX} ${innerY} H ${innerX + innerWidth} ` +
    `V ${innerY + innerHeight} H ${innerX} Z`

  return (
    <path
      fillRule="evenodd"
      d={`${outerPath} ${innerPath}`}
      fill={COLORS.white}
      stroke={COLORS.black90}
      strokeWidth="1"
    />
  )
}
