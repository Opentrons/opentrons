import { DEFAULT_TIP_SIZE } from './constants'

export function NoTip(props: { size?: string }): JSX.Element {
  const { size } = props
  const width = size ?? DEFAULT_TIP_SIZE
  const height = size ?? DEFAULT_TIP_SIZE
  return (
    <svg
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <mask
        id="mask0_2315_3507"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <path
          d="M10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10C0.5 4.7533 4.7533 0.5 10 0.5Z"
          fill="#CBCCCC"
          stroke="black"
        />
      </mask>
      <g mask="url(#mask0_2315_3507)">
        <path
          d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z"
          fill="#CBCCCC"
          stroke="#737578"
          stroke-width="2"
        />
        <line
          x1="24.7071"
          y1="-4.29289"
          x2="-3.29289"
          y2="23.7071"
          stroke="#737578"
          stroke-width="2"
        />
      </g>
    </svg>
  )
}
