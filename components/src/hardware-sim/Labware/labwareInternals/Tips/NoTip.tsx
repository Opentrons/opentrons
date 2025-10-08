export function NoTip(props: { size?: string | number }): JSX.Element {
  const { size } = props
  const width = size ?? '20'
  const height = size ?? '20'
  return (
    <svg
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z"
        fill="#CBCCCC"
        stroke="#737578"
        strokeWidth="2"
      />
    </svg>
  )
}
