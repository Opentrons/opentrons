import * as React from 'react'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Flex,
  RESPONSIVENESS,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

interface SingleColumnContentWrapperProps extends StyleProps {
  children: React.ReactNode
}
// For flex-direction: column recovery content with one column only.
//
// For ODD use only.
export function RecoverySingleColumnContent({
  children,
  ...styleProps
}: SingleColumnContentWrapperProps): JSX.Element {
  return (
    <Flex
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={FLEX_HEIGHT}
      {...styleProps}
    >
      {children}
    </Flex>
  )
}

const FLEX_HEIGHT = css`
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    height= 29.25rem
  }
`
