import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  InlineNotification,
  JUSTIFY_CENTER,
  LegacyStyledText,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import type { MouseEventHandler, ReactNode } from 'react'
import type { InlineNotificationProps } from '@opentrons/components'

interface RobotSetupHeaderProps {
  header: string
  buttonText?: ReactNode
  inlineNotification?: InlineNotificationProps
  onClickBack?: MouseEventHandler
  onClickButton?: MouseEventHandler
}

export function RobotSetupHeader({
  buttonText,
  header,
  inlineNotification,
  onClickBack,
  onClickButton,
}: RobotSetupHeaderProps): ReactNode {
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
            <Icon name="back" size="3rem" color={COLORS.black90} />
          </Btn>
        ) : null}
        <LegacyStyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {header}
        </LegacyStyledText>
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
