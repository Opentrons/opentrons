import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface Props {
  iconColor: string
  children: React.ReactNode
  header: string
  subHeader: string
  isSuccess: boolean
}

export function SimpleWizardBody(props: Props): JSX.Element {
  const { iconColor, children, header, subHeader, isSuccess } = props

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        marginBottom="6.3125rem"
        marginTop="6.75rem"
      >
        <Icon
          name={isSuccess ? 'ot-check' : 'ot-alert'}
          size="2.5rem"
          color={iconColor}
          aria-label={isSuccess ? 'ot-check' : 'ot-alert'}
        />
        <StyledText
          css={TYPOGRAPHY.h1Default}
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing3}
        >
          {header}
        </StyledText>
        <StyledText as="p">{subHeader}</StyledText>
      </Flex>
      <Flex
        paddingX={SPACING.spacing6}
        paddingBottom={SPACING.spacing6}
        justifyContent={JUSTIFY_FLEX_END}
      >
        {children}
      </Flex>
    </Flex>
  )
}
