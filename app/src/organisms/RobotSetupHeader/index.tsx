import * as React from 'react'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { StyledText } from '../../atoms/text'

import type { InlineNotificationProps } from '../../atoms/InlineNotification'

interface RobotSetupHeaderProps {
  header: string
  buttonText?: React.ReactNode
  inlineNotification?: InlineNotificationProps
  onClickBack?: React.MouseEventHandler
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
    <Flex paddingX={SPACING.spacing40} paddingY={SPACING.spacing32}>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        position={POSITION_RELATIVE}
        width="100%"
      >
        {onClickBack != null ? (
          <Btn
            aria-label="back-button"
            onClick={onClickBack}
            position={POSITION_ABSOLUTE}
            left="0"
          >
            <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
          </Btn>
        ) : null}
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {header}
        </StyledText>
        {onClickButton != null && buttonText != null ? (
          <SmallButton
            buttonCategory="rounded"
            buttonText={buttonText}
            onClick={onClickButton}
            position={POSITION_ABSOLUTE}
            right="0"
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
    </Flex>
  )
}
