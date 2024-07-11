// TODO: replace this by making these props true of interventionmodal content wrappers
// once error recovery uses interventionmodal consistently

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
export function RecoveryContentWrapper({
  children,
  ...styleProps
}: SingleColumnContentWrapperProps): JSX.Element {
  return (
    <Flex
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={STYLE}
      {...styleProps}
    >
      {children}
    </Flex>
  )
}

const STYLE = css`
  padding: ${SPACING.spacing32};
  gap: ${SPACING.spacing24};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: none;
    height: 29.25rem;
  }
`
