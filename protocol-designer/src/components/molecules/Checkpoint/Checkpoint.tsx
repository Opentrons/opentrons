import { Box, COLORS, Flex, SPACING } from '@opentrons/components'

import type { PropsWithChildren } from 'react'

// todo(mm, 2025-08-26): Revisit the names of Checkpoint/CheckpointChip/CheckpointStepContainer,
// pending discussion with the design team.

interface CheckpointProps {
  /** Whether this `Checkpoint` is part of the active step in the timeline. */
  active: boolean
}

/**
 * A level of indentation in the timeline, containing steps to run concurrently
 * with a "parent step."
 *
 * This should be rendered directly after the parent step, as a sibling to it.
 *
 * Each child may be:
 *
 * - A `CheckpointChip`.
 * - A `CheckpointStepContainer`.
 * - A drag-and-drop indicator.
 */
export function Checkpoint(
  props: PropsWithChildren<CheckpointProps>
): JSX.Element {
  const { active, children } = props
  return (
    <Flex
      flexDirection="row"
      paddingY={SPACING.spacing4}
      gridGap={SPACING.spacing4}
    >
      <OrnamentalLine active={active} />
      <Box as="ul" flex="1">
        {children}
      </Box>
    </Flex>
  )
}

function OrnamentalLine(props: { active: boolean }): JSX.Element {
  const { active } = props
  return (
    <Box
      flex="none"
      // Note: Designs say padding=spacing4, but there it's measured to the center
      // of a spacing4 stroke. We're measuring to the outside of the stroke
      // so we gotta do (spacing4 - [spacing4 / 2]).
      padding={SPACING.spacing2}
    >
      <Box
        width="0.25rem"
        height="100%"
        borderRadius={SPACING.spacing2}
        backgroundColor={active ? COLORS.blue50 : COLORS.grey50}
      />
    </Box>
  )
}
