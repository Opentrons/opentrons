interface TipSvgProps {
  volume: number
  maxVolume: number
}

export const TipSvg = ({ volume, maxVolume }: TipSvgProps): JSX.Element => {
  const percent = Math.min(Math.max(volume / maxVolume, 0), 1) // clamp between 0–1
  const svgHeight = 188.6
  const fillHeight = svgHeight * percent
  const yStart = svgHeight - fillHeight

  return (
    <svg viewBox="0 0 164.9 188.6" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="fillClip">
          <rect x="0" y={yStart} width="164.9" height={fillHeight} />
        </clipPath>
      </defs>

      {/* Solid green fill (clipped) */}
      <path
        d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
        fill="green"
        stroke="none"
        clipPath="url(#fillClip)"
      />

      {/* Grey outline */}
      <path
        d="M71.2.2l3.5,77c0,1.1.6,2.1,1.5,2.6s1,.4,1.6.4.2,0,.4,0c1.4-.2,2.4-1.5,2.4-3L84.2.2"
        stroke="#737578"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
