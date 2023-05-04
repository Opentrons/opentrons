import { StyledText } from '../text'
import { Flex, BORDERS, COLORS, SPACING } from '@opentrons/components'
import * as React from 'react'

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
      backgroundColor={COLORS.fundamentalsBackgroundShade}
      borderRadius={BORDERS.radiusSoftCorners}
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
