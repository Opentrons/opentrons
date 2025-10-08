export function InaccessibleTip(props: {
  size?: string | number
}): JSX.Element {
  const { size } = props
  const width = size ?? '20'
  const height = size ?? '20'
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_2189_16275"
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
      <g mask="url(#mask0_2189_16275)">
        <path
          d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z"
          fill="#BFDCFD"
          stroke="#737578"
          strokeWidth="2"
        />
        <path
          d="M10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10C5 7.23858 7.23858 5 10 5Z"
          fill="#BFDCFD"
          stroke="#737578"
          strokeWidth="2"
        />
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
