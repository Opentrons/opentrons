import React from 'react'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface ControlContainerProps {
  title: string
  children: React.ReactNode
}

export const ControlContainer = (props: ControlContainerProps): JSX.Element => {
  return (
    <Box flex="50%" margin={SPACING.spacing2}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontSize={TYPOGRAPHY.fontSizeH6}
          marginY={SPACING.spacing3}
        >
          {props.title}
        </StyledText>
        <Flex
          backgroundColor={COLORS.fundamentalsBackground}
          borderRadius={BORDERS.radiusSoftCorners}
          padding={SPACING.spacing4}
          margin={SPACING.spacing1}
          width="100%"
          height="9.75rem"
        >
          {props.children}
        </Flex>
      </Flex>
    </Box>
  )
}
