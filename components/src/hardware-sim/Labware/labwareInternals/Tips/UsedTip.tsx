import { COLORS } from '../../../../helix-design-system'
import { DEFAULT_TIP_SIZE } from './constants'

export function UsedTip(props: { size?: string }): JSX.Element {
  const { size } = props
  const width = size ?? DEFAULT_TIP_SIZE
  const height = size ?? DEFAULT_TIP_SIZE
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill={COLORS.blue35} />
      <circle
        cx="10"
        cy="10"
        r="4.5"
        fill={COLORS.grey50}
        stroke={COLORS.grey50}
        strokeWidth="3"
      />
    </svg>
  )
}
