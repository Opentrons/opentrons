import { getWidthAndHeightOfWellSVG } from './utils'

import type { LabwareDefinition } from '@opentrons/shared-data'

export function EmptyWell(props: {
  size?: string
  labwareDefinition: LabwareDefinition
}): JSX.Element {
  const { size, labwareDefinition } = props

  const firstWell = labwareDefinition.wells.A1
  const isCircular = firstWell.shape === 'circular'
  const [width, height] = getWidthAndHeightOfWellSVG(labwareDefinition)
  const circularDimension = 20
  const viewBox = isCircular
    ? size || `0 0 ${circularDimension} ${circularDimension}`
    : size || `0 0 ${width} ${height}`

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
          <rect
            x="0.5"
            y="0.5"
            width={width}
            height={height}
            rx="2"
            fill="white"
          />
        )}
      </mask>

      <g mask="url(#emptyWellMask)">
        {isCircular ? (
          <circle
            cx="10"
            cy="10"
            r="9"
            fill="#CBCCCC"
            stroke="#737578"
            strokeWidth="2"
          />
        ) : (
          <rect
            x="1"
            y="1"
            width={width}
            height={height}
            rx="2"
            fill="#CBCCCC"
            stroke="#737578"
            strokeWidth="2"
          />
        )}

        <line
          x1={isCircular ? 24.7071 : width + 4.7071}
          y1={isCircular ? -4.29289 : -4.29289}
          x2={isCircular ? -3.29289 : -3.29289}
          y2={isCircular ? 23.7071 : height + 3.7071}
          stroke="#737578"
          strokeWidth="2"
        />
      </g>
    </svg>
  )
}
