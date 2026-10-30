import { INTERACTIVE_WELL_DATA_ATTRIBUTE } from '@opentrons/shared-data'

import { COLORS } from '../../../../helix-design-system'
import { LABWARE } from '../types'
import { getWidthAndHeightOfWellSVG } from './utils'

import type { ReactNode } from 'react'
import type { LabwareWellMap } from '@opentrons/shared-data'
import type { ParentType } from '../types'

interface EmptyWellProps {
  wellMap: LabwareWellMap
  parentType: ParentType
  wellName: string
  size: string
}

export function EmptyWell({
  size,
  wellMap,
  wellName,
  parentType,
}: EmptyWellProps): ReactNode {
  const commonProps = {
    [INTERACTIVE_WELL_DATA_ATTRIBUTE]: wellName,
  }
  const { shape } = wellMap.A1
  const isCircular = shape === 'circular'
  const [width, height] = getWidthAndHeightOfWellSVG(wellMap)
  const isLabware = parentType === LABWARE
  const outlineColor = isLabware ? COLORS.grey50 : COLORS.black90
  const circularSize = 20
  const viewBoxWidth = isCircular ? circularSize : width
  const viewBoxHeight = isCircular ? circularSize : height
  const viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`
  const lineStrokeWidth = isCircular ? 2 : 1

  const cx = 10
  const cy = 10
  const r = 9
  const angle = Math.PI / 4
  const dx = r * Math.cos(angle)
  const dy = r * Math.sin(angle)
  const lineProps = isCircular
    ? {
        x1: cx - dx,
        y1: cy - dy,
        x2: cx + dx,
        y2: cy + dy,
      }
    : { x1: 0, y1: 0, x2: viewBoxWidth, y2: viewBoxHeight }

  const maskId = 'emptyWellMask'

  return (
    <svg
      width={isCircular ? size : width}
      height={isCircular ? size : height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g mask={`url(#${maskId})`}>
        {isCircular ? (
          <circle
            cx="10"
            cy="10"
            r="9"
            fill="#CBCCCC"
            stroke={outlineColor}
            strokeWidth="2"
            {...commonProps}
          />
        ) : (
          <rect
            width={width}
            height={height}
            fill="#CBCCCC"
            stroke={outlineColor}
            strokeWidth="2"
            {...commonProps}
          />
        )}

        <line
          {...lineProps}
          stroke={outlineColor}
          strokeWidth={lineStrokeWidth}
        />
      </g>
    </svg>
  )
}
