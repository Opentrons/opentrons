import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_FLEX_START,
  RESPONSIVENESS,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface CommandIndexProps {
  index: string
  allowSpaceForNDigits?: number
}

export function CommandIndex({
  index,
  allowSpaceForNDigits,
}: CommandIndexProps): ReactNode {
  return (
    <Flex
      justifyContent={JUSTIFY_FLEX_START}
      alignItems={ALIGN_CENTER}
      width="100%"
      maxWidth={`${Math.max(allowSpaceForNDigits ?? 0, 3)}ch`}
      css={`
        @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
          display: none;
        }
      `}
    >
      <StyledText desktopStyle="captionRegular"> {index} </StyledText>
    </Flex>
  )
}
