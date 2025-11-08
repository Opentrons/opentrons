import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import type { PropsWithChildren } from 'react'

/** A list to contain `StepFormStatus` elements. */
export function StepFormStatusList(props: PropsWithChildren): JSX.Element {
  const { children } = props
  return (
    <Flex as="dl" flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      {children}
    </Flex>
  )
}
