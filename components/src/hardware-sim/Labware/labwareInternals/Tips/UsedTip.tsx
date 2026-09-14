import { INTERACTIVE_WELL_DATA_ATTRIBUTE } from '@opentrons/shared-data'

import { COLORS } from '../../../../helix-design-system'
import { DEFAULT_TIP_SIZE } from './constants'

import type { ReactNode } from 'react'

export function UsedTip(props: { wellName: string; size?: string }): ReactNode {
  const { size, wellName } = props
  const width = size ?? DEFAULT_TIP_SIZE
  const height = size ?? DEFAULT_TIP_SIZE
  const commonProps = {
    [INTERACTIVE_WELL_DATA_ATTRIBUTE]: wellName,
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill={COLORS.blue35} {...commonProps} />
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
