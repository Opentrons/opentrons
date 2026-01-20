import {
  COLORS,
  CURSOR_POINTER,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import type { Dispatch, SetStateAction } from 'react'

interface TipSvgProps {
  volume: number
  maxVolume: number
  roundedXPositionPixels: number
  bottomPx: number
  color: string
  setIsHovered: Dispatch<SetStateAction<boolean>>
  isHovered: boolean
  airGapVolume: number
}

export const TipSvg = ({
  volume,
  maxVolume,
  roundedXPositionPixels,
  bottomPx,
  color,
  setIsHovered,
  isHovered,
  airGapVolume,
}: TipSvgProps): JSX.Element => {
  const pathTopY = 0.2
  const pathBottomY = 80
  const pathHeight = pathBottomY - pathTopY

  const liquidPercent = Math.min(Math.max(volume / maxVolume, 0), 1)
  const airPercent = Math.min(Math.max(airGapVolume / maxVolume, 0), 1)

  const airGapHeight = pathHeight * airPercent
  const liquidFillHeight = pathHeight * liquidPercent

  const liquidBottomY = pathBottomY - airGapHeight
  const liquidTopY = liquidBottomY - liquidFillHeight

  return (
    <svg
      viewBox="0 0 164.9 188.6"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: POSITION_ABSOLUTE,
        transform: `translate(${roundedXPositionPixels}px)`,
        bottom: `${bottomPx + 33}px`,
      }}
    >
      <defs>
        {/* Clip for liquid */}
        <clipPath id="liquidClip">
          <rect x="71.2" y={liquidTopY} width="13" height={liquidFillHeight} />
        </clipPath>

        {/* Clip for air gap */}
        <clipPath id="airGapClip">
          <rect x="71.2" y={liquidBottomY} width="13" height={airGapHeight} />
        </clipPath>
      </defs>

      <g>
        {/* Air gap path, clipped to match the tip shape */}
        {airGapHeight > 0 && (
          <path
            d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
            fill={COLORS.grey10}
            stroke="none"
            clipPath="url(#airGapClip)"
          />
        )}

        {/* Liquid path */}
        <path
          d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
          fill={isHovered ? COLORS.flex50 : color}
          stroke="none"
          clipPath="url(#liquidClip)"
          onMouseEnter={() => {
            setIsHovered(true)
          }}
          onMouseLeave={() => {
            setIsHovered(false)
          }}
          cursor={CURSOR_POINTER}
        />

        {/* Outline */}
        <path
          d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
          stroke="#737578"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
