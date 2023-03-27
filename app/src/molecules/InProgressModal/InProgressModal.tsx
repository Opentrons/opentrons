import * as React from 'react'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Flex,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface Props {
  //  optional override of the spinner
  alternativeSpinner?: React.ReactNode
  description?: string
  children?: JSX.Element
}

export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children, description } = props

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      height="24.625rem"
      padding={SPACING.spacing6}
    >
      {alternativeSpinner ?? (
        <Icon
          name="ot-spinner"
          size="5.125rem"
          color={COLORS.darkGreyEnabled}
          aria-label="spinner"
          spin
        />
      )}
      {description != null && (
        <StyledText
          css={TYPOGRAPHY.h1Default}
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing3}
        >
          {description}
        </StyledText>
      )}
      {children}
    </Flex>
  )
}
