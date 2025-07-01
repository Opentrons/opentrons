interface TipSvgProps {
  volume: number
  maxVolume: number
  roundedXPositionPixels: number
  bottomPx: number
  color: string
}

export const TipSvg = ({
  volume,
  maxVolume,
  roundedXPositionPixels,
  bottomPx,
  color,
}: TipSvgProps): JSX.Element => {
  const percent = Math.min(Math.max(volume / maxVolume, 0), 1) // clamp between 0–1
  const pathTopY = 0.2
  const pathBottomY = 80
  const pathHeight = pathBottomY - pathTopY
  const fillHeight = pathHeight * percent
  const yStart = pathBottomY - fillHeight
  return (
    <svg
      viewBox="0 0 164.9 188.6"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        transform: `translate(${roundedXPositionPixels}px)`,
        bottom: `${bottomPx + 33}px`,
      }}
    >
      <defs>
        <clipPath id="fillClip">
          <rect x="71.2" y={yStart} width="13" height={fillHeight} />
        </clipPath>
      </defs>
      <g>
        <path
          d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
          fill={color}
          stroke="none"
          clipPath="url(#fillClip)"
        />

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
