interface WellSvgProps {
  volume: number
  maxVolume: number
  color: string
}

export function WellSvg({
  volume,
  maxVolume,
  color,
}: WellSvgProps): JSX.Element {
  const percent = Math.min(Math.max(volume / maxVolume, 0), 1)

  const wellTopY = 61.4
  const wellBottomY = 149.1
  const wellHeight = wellBottomY - wellTopY
  const fillHeight = wellHeight * percent
  const fillYStart = wellBottomY - fillHeight

  return (
    <svg
      viewBox="0 0 164.9 188.6"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Side: Cover, Well + measurements"
    >
      <defs>
        <clipPath id="wellFillClip">
          <rect x="43.2" y={fillYStart} width="59.8" height={fillHeight} />
        </clipPath>
      </defs>
      <style>
        {`
            .cls-1 { fill: none; stroke-width: 0px; }
            .cls-2 { fill: none; stroke: #16212d; stroke-linecap: round; stroke-width: 2px; stroke-miterlimit: 10; }
            .cls-3 { fill: none; stroke: #4a4c4e; stroke-width: 1.5px; stroke-miterlimit: 10; }
          `}
      </style>

      <path
        id="cover"
        className="cls-1"
        d="M0,61.4h53.2v64.7c0,12.7,10.3,23,23,23h3c12.7,0,23-10.3,23-23V61.4h62.8v127.2H0V61.4Z"
      />

      {/* Dynamic fill inside well */}
      <path
        d="M43.2,61.4h10v64.7c0,12.7,10.3,23,23,23h3c12.7,0,23-10.3,23-23V61.4h10"
        fill={color}
        clipPath="url(#wellFillClip)"
      />

      <path
        id="well"
        className="cls-2"
        d="M43.2,61.4h10v64.7c0,12.7,10.3,23,23,23h3c12.7,0,23-10.3,23-23V61.4h10"
      />

      <g id="height_measurement">
        <g>
          <line className="cls-3" x1="125.5" y1="61.4" x2="125.5" y2="74.5" />
          <line className="cls-3" x1="130" y1="61.4" x2="120.9" y2="61.4" />
        </g>
        <g>
          <line className="cls-3" x1="125.5" y1="149.1" x2="125.5" y2="135.9" />
          <line className="cls-3" x1="120.9" y1="149.1" x2="130" y2="149.1" />
        </g>
      </g>

      <g id="width_measurement">
        <g>
          <line className="cls-3" x1="112" y1="160.9" x2="107.8" y2="160.9" />
          <line className="cls-3" x1="112" y1="165.4" x2="112" y2="156.3" />
        </g>
        <g>
          <line className="cls-3" x1="43.3" y1="160.9" x2="47.4" y2="160.9" />
          <line className="cls-3" x1="43.3" y1="156.3" x2="43.3" y2="165.4" />
        </g>
      </g>
    </svg>
  )
}
