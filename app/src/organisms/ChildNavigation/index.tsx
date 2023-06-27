import * as React from 'react'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

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
        <Btn onClick={onClickBack}>
          <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
        </Btn>
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {header}
        </StyledText>
      </Flex>
      {onClickButton != null && buttonText != null ? (
        <SmallButton
          buttonType="primary"
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
