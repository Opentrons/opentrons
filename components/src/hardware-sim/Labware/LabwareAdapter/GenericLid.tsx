import type { ReactNode } from 'react'

interface GenericLidProps {
  lidDimensions: {
    xDimension: number
    yDimension: number
    zDimension: number
  } | null
}
export function GenericLid(props: GenericLidProps): ReactNode {
  return (
    <svg
      id="GenericLid"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={props.lidDimensions?.xDimension ?? 128.76}
      height={props.lidDimensions?.yDimension ?? 85.8}
      viewBox="0 0 127.68 85.8"
    >
      <g id="BgFill">
        <path
          stroke="#4a4a4a"
          fill="#16212D"
          opacity={0.2}
          strokeWidth=".5px"
          strokeMiterlimit={10}
          d="M1.69238 0.976562H126.495C127.3 0.976562 127.952 1.62901 127.952 2.43359V84.2646C127.952 85.0694 127.3 85.7217 126.495 85.7217H1.69238C0.887798 85.7215 0.235352 85.0693 0.235352 84.2646V2.43359C0.235578 1.62915 0.887938 0.976788 1.69238 0.976562Z"
        />
      </g>
      <g id="Outline">
        <path
          id="Outline"
          stroke="#4a4a4a"
          fill="none"
          strokeWidth=".4px"
          strokeMiterlimit={10}
          d="M1.69238 0.976562H126.495C127.3 0.976562 127.952 1.62901 127.952 2.43359V84.2646C127.952 85.0694 127.3 85.7217 126.495 85.7217H1.69238C0.887798 85.7215 0.235352 85.0693 0.235352 84.2646V2.43359C0.235578 1.62915 0.887938 0.976788 1.69238 0.976562Z"
        />
        <path
          id="topLeftBracket"
          stroke="#4a4a4a"
          fill="none"
          strokeWidth=".4px"
          strokeMiterlimit={10}
          d="M110.875 4.69922H122.621C123.248 4.69922 123.756 5.20752 123.756 5.83454V17.5804"
        />
        <path
          id="topRightBracket"
          stroke="#4a4a4a"
          fill="none"
          strokeWidth=".4px"
          strokeMiterlimit={10}
          d="M16.8398 4.69922H5.09396C4.46694 4.69922 3.95864 5.20752 3.95864 5.83454V17.5804"
        />
        <path
          id="bottomLeftBracket"
          stroke="#4a4a4a"
          fill="none"
          strokeWidth=".4px"
          strokeMiterlimit={10}
          d="M110.875 81.9863H122.621C123.248 81.9863 123.756 81.478 123.756 80.851V69.1051"
        />
        <path
          id="bottomRightBracket"
          stroke="#4a4a4a"
          fill="none"
          strokeWidth=".4px"
          strokeMiterlimit={10}
          d="M16.8398 81.9863H5.09396C4.46694 81.9863 3.95863 81.478 3.95863 80.851V69.1051"
        />
      </g>
    </svg>
  )
}
