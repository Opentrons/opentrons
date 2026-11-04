import { useId } from 'react'

import { COLORS } from '@opentrons/components'

import type { Dispatch, SetStateAction } from 'react'

export const WELL_VIEWBOX = { width: 165, height: 136 }
export const WELL_GEOMETRY = {
  topY: 21.4,
  bottomY: 109.1,
  leftX: 43.2,
  rightX: 112.2,
}

interface WellSvgProps {
  volume: number
  maxVolume: number
  color: string
  setIsHovered: Dispatch<SetStateAction<boolean>>
  isHovered: boolean
}

export function WellSvg({
  volume,
  maxVolume,
  color,
  setIsHovered,
  isHovered,
}: WellSvgProps): JSX.Element {
  const clipId = useId()
  const percent = Math.min(Math.max(volume / maxVolume, 0), 1)

  const wellHeight = WELL_GEOMETRY.bottomY - WELL_GEOMETRY.topY
  const fillHeight = wellHeight * percent
  const fillYStart = WELL_GEOMETRY.bottomY - fillHeight

  return (
    <g aria-label="Side: Cover, Well + measurements">
      <defs>
        <clipPath id={clipId}>
          <rect
            x={WELL_GEOMETRY.leftX}
            y={fillYStart}
            width={WELL_GEOMETRY.rightX - WELL_GEOMETRY.leftX}
            height={fillHeight}
          />
        </clipPath>
      </defs>

      <style>
        {`
          .cls-1 { fill: none; stroke-width: 0px; }
          .cls-2 { fill: none; stroke: #16212D; stroke-linecap: round; stroke-width: 2px; stroke-miterlimit: 10; }
          .cls-3 { fill: none; stroke: #4A4C4E; stroke-width: 1.5px; stroke-miterlimit: 10; }
        `}
      </style>

      <path
        d="M0 21.4H53.2V109.1H102.2V21.4H165V148.6H0V21.4Z"
        fill="#F3F3F3"
      />

      {/* Dynamic fill inside well */}
      <path
        d="M43.2 21.4H53.2V109.1H102.2V21.4H112.2"
        fill={isHovered ? COLORS.flex50 : color}
        clipPath={`url(#${clipId})`}
        onMouseEnter={() => {
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
        cursor="pointer"
      />

      <path className="cls-2" d="M43.2 21.4H53.2V109.1H102.2V21.4H112.2" />

      <path
        className="cls-3"
        d="M125.5 21.4V34.5M130 21.4H120.9M125.5 109.1V95.9M120.9 109.1H130"
      />
    </g>
  )
}
