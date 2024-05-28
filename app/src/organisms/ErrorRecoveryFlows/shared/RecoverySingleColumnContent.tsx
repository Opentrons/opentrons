import * as React from 'react'

import {
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Flex,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

interface SingleColumnContentWrapperProps extends StyleProps {
  children: React.ReactNode
}
// For flex-direction: column recovery content with one column only.
export function RecoverySingleColumnContent({
  children,
  ...styleProps
}: SingleColumnContentWrapperProps): JSX.Element {
  return (
    <Flex
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="29.25rem"
      {...styleProps}
    >
      {children}
    </Flex>
  )
}
