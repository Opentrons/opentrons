import { COLORS } from '../../../../helix-design-system'
import { LABWARE } from '../types'
import { getWidthAndHeightOfWellSVG } from './utils'

import type { LabwareWellMap } from '@opentrons/shared-data'
import type { ParentType } from '../types'

interface EmptyWellProps {
  wellMap: LabwareWellMap
  parentType: ParentType
  size?: string
}

export function EmptyWell(props: EmptyWellProps): JSX.Element {
  const { size, wellMap, parentType } = props
  const firstWell = wellMap.A1
  const isCircular = firstWell.shape === 'circular'
  const [width, height] = getWidthAndHeightOfWellSVG(wellMap)
  const isLabware = parentType === LABWARE
  const outlineColor = isLabware ? COLORS.grey50 : COLORS.black90
  const circularDimension = 20
  const viewBoxWidth = isCircular ? circularDimension : width
  const viewBoxHeight = isCircular ? circularDimension : height
  const viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`
  const lineStrokeWidth = isCircular ? 2 : 1
  const lineProps = isLabware
    ? {
        x1: 0,
        y1: 0,
        x2: viewBoxWidth,
        y2: viewBoxHeight,
      }
    : {
        x1: viewBoxWidth,
        y1: 0,
        x2: 0,
        y2: viewBoxHeight,
      }
  return (
    <svg
      width={size ?? width}
      height={size ?? height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="emptyWellMask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={isCircular ? circularDimension : width}
        height={isCircular ? circularDimension : height}
      >
        {isCircular ? (
          <circle cx="10" cy="10" r="9.5" fill="white" />
        ) : (
          <rect x="0" y="0" width={width} height={height} fill="white" />
        )}
      </mask>

      <g mask="url(#emptyWellMask)">
        {isCircular ? (
          <circle
            cx="10"
            cy="10"
            r="9"
            fill="#CBCCCC"
            stroke={outlineColor}
            strokeWidth="3"
          />
        ) : (
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="#CBCCCC"
            stroke={outlineColor}
            strokeWidth="2"
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
