import { getWidthAndHeightOfWellSVG } from './utils'

import type { LabwareDefinition } from '@opentrons/shared-data'

export function EmptyWell(props: {
  size?: string
  labwareDefinition: LabwareDefinition
}): JSX.Element {
  const { size, labwareDefinition } = props

  const firstWell = labwareDefinition.wells.A1
  const wellShape = firstWell.shape
  const [width, height] = getWidthAndHeightOfWellSVG(labwareDefinition)

  const isCircular = wellShape === 'circular'

  return (
    <svg
      width={size ?? width}
      height={size ?? height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <mask
        id="emptyWellMask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        {isCircular ? (
          <circle cx="10" cy="10" r="9.5" fill="white" />
        ) : (
          <rect x="0.5" y="0.5" width="19" height="19" rx="2" fill="white" />
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
            width="18"
            height="18"
            rx="2"
            fill="#CBCCCC"
            stroke="#737578"
            strokeWidth="2"
          />
        )}

        {/* diagonal slash */}
        <line
          x1="24.7071"
          y1="-4.29289"
          x2="-3.29289"
          y2="23.7071"
          stroke="#737578"
          strokeWidth="2"
        />
      </g>
    </svg>
  )
}
