export function SelectedTip(props: { size?: string | number }): JSX.Element {
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
      <circle cx="10" cy="10" r="10" fill="#006CFA" />
    </svg>
  )
}
