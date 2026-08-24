import {
  BORDERS,
  COLORS,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface InstrumentContainerProps {
  displayName: string
  id?: string
}

export const InstrumentContainer = (
  props: InstrumentContainerProps
): ReactNode => {
  const { displayName, id } = props

  return (
    <Flex
      backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
      borderRadius={BORDERS.borderRadius4}
      paddingX={SPACING.spacing8}
      paddingY={SPACING.spacing2}
      width="max-content"
    >
      <LegacyStyledText forwardedAs="p" id={id}>
        {displayName}
      </LegacyStyledText>
    </Flex>
  )
}
