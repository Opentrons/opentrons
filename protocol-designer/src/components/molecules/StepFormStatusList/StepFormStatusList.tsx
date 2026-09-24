import { DIRECTION_COLUMN, DISPLAY_FLEX, SPACING } from '@opentrons/components'

import type { PropsWithChildren, ReactNode } from 'react'

/** A list to contain `StepFormStatus` elements. */
export function StepFormStatusList(props: PropsWithChildren): ReactNode {
  const { children } = props
  return (
    <dl
      style={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        gap: SPACING.spacing4,
      }}
    >
      {children}
    </dl>
  )
}
