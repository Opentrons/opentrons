import * as React from 'react'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  RESPONSIVENESS,
} from '@opentrons/components'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

import { SmallButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { StyledText } from '../../atoms/text'

import type { InlineNotificationProps } from '../../atoms/InlineNotification'

interface ChildNavigationProps {
  header: string
  onClickBack: React.MouseEventHandler
  buttonText?: React.ReactNode
  inlineNotification?: InlineNotificationProps
  onClickButton?: React.MouseEventHandler
}

export function ChildNavigation({
  buttonText,
  header,
  inlineNotification,
  onClickBack,
  onClickButton,
}: ChildNavigationProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      height="7.75rem"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing40}
      paddingY={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing16} justifyContent={JUSTIFY_FLEX_START}>
        <IconButton onClick={onClickBack}>
          <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
        </IconButton>
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {header}
        </StyledText>
      </Flex>
      {onClickButton != null && buttonText != null ? (
        <SmallButton
          buttonCategory="rounded"
          buttonText={buttonText}
          onClick={onClickButton}
        />
      ) : null}
      {inlineNotification != null ? (
        <InlineNotification
          heading={inlineNotification.heading}
          hug={true}
          type={inlineNotification.type}
        />
      ) : null}
    </Flex>
  )
}

const IconButton = styled('button')`
  border-radius: ${SPACING.spacing4};
  max-height: 100%;
  background-color: ${COLORS.white};

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.darkBlack20};
  }
  &:disabled {
    background-color: transparent;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: default;
  }
`
