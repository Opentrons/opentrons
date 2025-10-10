import { COLORS } from '../../../../helix-design-system'
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
      <path
        d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z"
        fill={COLORS.grey35}
        stroke={COLORS.grey50}
        strokeWidth="2"
      />
    </svg>
  )
}
