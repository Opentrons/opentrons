import {
  StyledText,
  RESPONSIVENESS,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'

export interface CommandIndexProps {
  index: string
  allowSpaceForNDigits?: number
}

export function CommandIndex({
  index,
  allowSpaceForNDigits,
}: CommandIndexProps): JSX.Element {
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
