import { COLORS, Flex, SPACING, StyledText } from '@opentrons/components'

interface ConcurrentGroupCheckpointProps {
  text: string
}

/** A non-interactable, system-provided step within a `ConcurrentGroup`. */
export function ConcurrentGroupCheckpoint(
  props: ConcurrentGroupCheckpointProps
): JSX.Element {
  const { text } = props
  return (
    <Flex
      gap={SPACING.spacing4}
      paddingY={SPACING.spacing2}
      color={COLORS.grey60}
    >
      <Flex
        paddingX={SPACING.spacing2}
        paddingTop={SPACING.spacing6}
        flexDirection="column"
      >
        <Bullet />
      </Flex>
      <StyledText desktopStyle="captionSemiBold">{text}</StyledText>
    </Flex>
  )
}

function Bullet(): JSX.Element {
  return (
    <svg width="0.25rem" height="0.25rem" viewBox="-1 -1 2 2">
      <circle fill="currentColor" cx="0" cy="0" r="1" />
    </svg>
  )
}
