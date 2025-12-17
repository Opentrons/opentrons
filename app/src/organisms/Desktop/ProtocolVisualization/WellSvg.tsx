import { COLORS } from '@opentrons/components'

import type { Dispatch, SetStateAction } from 'react'

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
  const percent = Math.min(Math.max(volume / maxVolume, 0), 1)

  const wellTopY = 21.4
  const wellBottomY = 109.1
  const wellHeight = wellBottomY - wellTopY
  const fillHeight = wellHeight * percent
  const fillYStart = wellBottomY - fillHeight

  return (
    <svg
      viewBox="0 0 165 136"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Side: Cover, Well + measurements"
    >
      <defs>
        <clipPath id="wellFillClip">
          <rect x="43.2" y={fillYStart} width="69" height={fillHeight} />
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
        clipPath="url(#wellFillClip)"
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
    </svg>
  )
}
