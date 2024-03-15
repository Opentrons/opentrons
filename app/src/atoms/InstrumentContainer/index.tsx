import * as React from 'react'

import { Flex, BORDERS, COLORS, SPACING } from '@opentrons/components'

import { StyledText } from '../text'

interface InstrumentContainerProps {
  displayName: string
  id?: string
}

export const InstrumentContainer = (
  props: InstrumentContainerProps
): JSX.Element => {
  const { displayName, id } = props

  return (
    <Flex
      backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
      borderRadius={BORDERS.borderRadius4}
      paddingX={SPACING.spacing8}
      paddingY={SPACING.spacing2}
      width="max-content"
    >
      <StyledText as="p" id={id}>
        {displayName}
      </StyledText>
    </Flex>
  )
}
