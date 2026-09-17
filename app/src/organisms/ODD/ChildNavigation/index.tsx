import styled from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  CURSOR_DEFAULT,
  DIRECTION_ROW,
  Flex,
  Icon,
  InlineNotification,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  POSITION_FIXED,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'

import type { ComponentProps, MouseEventHandler, ReactNode } from 'react'
import type {
  IconName,
  InlineNotificationProps,
  StyleProps,
} from '@opentrons/components'
import type {
  ButtonCategory,
  IconPlacement,
  SmallButtonTypes,
} from '/app/atoms/buttons/SmallButton'

export interface ChildNavigationProps extends StyleProps {
  header: string
  onClickBack?: MouseEventHandler
  buttonText?: ReactNode
  inlineNotification?: InlineNotificationProps
  onClickButton?: MouseEventHandler
  buttonType?: SmallButtonTypes
  buttonCategory?: ButtonCategory
  buttonIsDisabled?: boolean
  iconName?: IconName
  backIconName?: IconName
  iconPlacement?: IconPlacement
  secondaryButtonProps?: ComponentProps<typeof SmallButton>
  ariaDisabled?: boolean
}

export function ChildNavigation({
  buttonText,
  header,
  inlineNotification,
  onClickBack,
  onClickButton,
  buttonType = 'primary',
  buttonCategory,
  iconName,
  backIconName,
  iconPlacement,
  secondaryButtonProps,
  buttonIsDisabled,
  ariaDisabled = false,
  ...styleProps
}: ChildNavigationProps): ReactNode {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      height="7.75rem"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing40}
      paddingY={SPACING.spacing32}
      position={POSITION_FIXED}
      top="0"
      left="0"
      width="100%"
      backgroundColor={COLORS.white}
      {...styleProps}
    >
      <Flex gridGap={SPACING.spacing16} justifyContent={JUSTIFY_FLEX_START}>
        {onClickBack != null ? (
          <IconButton
            type="button"
            aria-label="Back to previous page"
            onClick={onClickBack}
            data-testid="ChildNavigation_Back_Button"
          >
            <Icon
              name={backIconName || 'back'}
              size="3rem"
              color={COLORS.black90}
            />
          </IconButton>
        ) : null}
        <LegacyStyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {header}
        </LegacyStyledText>
      </Flex>
      {onClickButton != null && buttonText != null ? (
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          {secondaryButtonProps != null ? (
            <SmallButton
              data-testid="ChildNavigation_Secondary_Button"
              {...secondaryButtonProps}
            />
          ) : null}

          <SmallButton
            buttonType={buttonType}
            buttonCategory={
              buttonCategory ??
              (buttonType === 'primary' ? 'rounded' : 'default')
            }
            buttonText={buttonText}
            onClick={onClickButton}
            iconName={iconName}
            iconPlacement={iconPlacement}
            disabled={buttonIsDisabled}
            data-testid="ChildNavigation_Primary_Button"
            ariaDisabled={ariaDisabled}
          />
        </Flex>
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
    background-color: ${COLORS.grey35};
  }
  &:disabled {
    background-color: transparent;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: ${CURSOR_DEFAULT};
  }
`
