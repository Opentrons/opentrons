import * as React from 'react'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { StyledText } from '../../atoms/text'

import type { InlineNotificationProps } from '../../atoms/InlineNotification'

interface RobotSetupHeaderProps {
  header: string
  onClickBack: React.MouseEventHandler
  buttonText?: React.ReactNode
  inlineNotification?: InlineNotificationProps
  onClickButton?: React.MouseEventHandler
}

export function RobotSetupHeader({
  buttonText,
  header,
  inlineNotification,
  onClickBack,
  onClickButton,
}: RobotSetupHeaderProps): JSX.Element {
  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Btn onClick={onClickBack}>
        <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
      </Btn>
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {header}
      </StyledText>
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
