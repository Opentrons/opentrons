import {
  Box,
  COLORS,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import type { PropsWithChildren } from 'react'

interface ConcurrentGroupProps {
  /** Whether this `ConcurrentGroup` is part of the active step in the timeline. */
  active: boolean
}

/**
 * A level of indentation in the timeline, containing steps to run concurrently
 * with a "parent step."
 *
 * This should be rendered directly after the parent step, as a sibling to it.
 *
 * Each child should be a `ConcurrentGroupChild`.
 */
export function ConcurrentGroup(
  props: PropsWithChildren<ConcurrentGroupProps>
): JSX.Element {
  const { active, children } = props
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      paddingY={SPACING.spacing4}
      gridGap={SPACING.spacing4}
    >
      <OrnamentalLine active={active} />
      <ul
        style={{
          flex: '1',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </ul>
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
        aria-label="ConcurrentGroup OrnamentalLine"
      />
    </Box>
  )
}
