import { Flex, SPACING, StyledText } from '@opentrons/components'

import spacingStyles from './commonspacing.module.css'

// todo(mm, 2025-08-26): Revisit the names of Checkpoint/CheckpointChip/CheckpointStepContainer,
// pending discussion with the design team.

interface CheckpointChipProps {
  text: string
}

/** A non-interactable, system-provided step within a `Checkpoint`. */
export function CheckpointChip(props: CheckpointChipProps): JSX.Element {
  const { text } = props
  return (
    <div className={spacingStyles.chip}>
      <Flex gap={SPACING.spacing4} paddingY={SPACING.spacing2}>
        <Flex
          paddingX={SPACING.spacing2}
          paddingTop={SPACING.spacing6}
          flexDirection="column"
        >
          <Bullet />
        </Flex>
        <StyledText desktopStyle="captionSemiBold">{text}</StyledText>
      </Flex>
    </div>
  )
}

function Bullet(): JSX.Element {
  return (
    <svg width="0.25rem" height="0.25rem" viewBox="-1 -1 2 2">
      <circle cx="0" cy="0" r="1" />
    </svg>
  )
}
