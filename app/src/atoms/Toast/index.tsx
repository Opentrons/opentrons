import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  BORDER_STYLE_SOLID,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../text'
import { getIsOnDevice } from '../../redux/config'

import type { IconName, IconProps, StyleProps } from '@opentrons/components'

export const ALERT_TOAST: 'alert' = 'alert'
export const SUCCESS_TOAST: 'success' = 'success'
export const WARNING_TOAST: 'warning' = 'warning'
export const ERROR_TOAST: 'error' = 'error'
export const INFO_TOAST: 'info' = 'info'

export type ToastType =
  | typeof ALERT_TOAST
  | typeof SUCCESS_TOAST
  | typeof WARNING_TOAST
  | typeof ERROR_TOAST
  | typeof INFO_TOAST

export interface ToastProps extends StyleProps {
  id: string
  message: string
  type: ToastType
  icon?: IconProps
  closeButton?: boolean
  buttonText?: string
  onClose?: () => void
  disableTimeout?: boolean
  duration?: number
  heading?: string
}

const TOAST_ANIMATION_DURATION = 500

// TODO(bh: 2022-12-1): implement css for toast removal -
// a bit complicated because removal removes the element from the DOM immediately
// a library like react-transition-group is a possible solution

// The toaster oven and the rest of the monorepo only knows about one kind of toast,
// but they are displayed and animated differently depending on if they are viewed
// in the desktop app or the OnDeviceDisplay. To better test the two behaviors
// and to better view them in storybook, I'm exporting them as two different
// elements here. If the two applications ever behave the same way, they can be
// condensed further, but until then this is the best way to see and test their
// differences.
//
// Just keep it a secret from the rest of the repo, ok? It doesn't need to know.

export const DesktopToast = (props: ToastProps): JSX.Element => {
  const {
    message,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
    duration = 8000,
    heading,
    ...styleProps
  } = props

  const EXPANDED_STYLE = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slidein;
    overflow: hidden;

    @keyframes slidein {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0%);
      }
    }
  `

  const toastStyleByType: {
    [k in ToastType]: {
      iconName: IconName
      color: string
      backgroundColor: string
    }
  } = {
    [ALERT_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.yellow_two,
      backgroundColor: COLORS.yellow_four,
    },
    [ERROR_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.errorEnabled,
      backgroundColor: COLORS.errorBackgroundLight,
    },
    [INFO_TOAST]: {
      iconName: 'information',
      color: COLORS.darkGreyEnabled,
      backgroundColor: COLORS.darkGreyDisabled,
    },
    [SUCCESS_TOAST]: {
      iconName: 'check-circle',
      color: COLORS.successEnabled,
      backgroundColor: COLORS.successBackgroundLight,
    },
    [WARNING_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.warningEnabled,
      backgroundColor: COLORS.warningBackgroundLight,
    },
  }

  if (!disableTimeout) {
    setTimeout(() => {
      onClose?.()
    }, duration)
  }

  return (
    // maxWidth is based on default app size ratio, minWidth of 384px
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.radiusSoftCorners}
      borderColor={toastStyleByType[type].color}
      borderWidth={SPACING.spacingXXS}
      border={BORDER_STYLE_SOLID}
      backgroundColor={toastStyleByType[type].backgroundColor}
      // adjust padding when heading is present and creates extra column
      padding={`${heading != null ? SPACING.spacing2 : SPACING.spacing3} ${
        SPACING.spacing3
      } ${heading != null ? SPACING.spacing2 : SPACING.spacing3} 0.75rem`}
      data-testid={`Toast_${type}`}
      maxWidth="88%"
      minWidth="24rem"
      {...styleProps}
    >
      <Flex flexDirection={DIRECTION_ROW} overflow="hidden" width="100%">
        <Icon
          name={icon?.name ?? toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          width={SPACING.spacing4}
          marginRight={SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
          aria-label={`icon_${type}`}
        />
        <Flex flexDirection={DIRECTION_COLUMN} overflow="hidden" width="100%">
          {heading != null ? (
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {heading}
            </StyledText>
          ) : null}
          <StyledText as="p">{message}</StyledText>
        </Flex>
      </Flex>
      {closeButton === true && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <Icon
            name="close"
            width={SPACING.spacing5}
            marginLeft={SPACING.spacing3}
          />
        </Link>
      )}
    </Flex>
  )
}

export const ODDToast = (props: ToastProps): JSX.Element => {
  const {
    buttonText,
    closeButton,
    disableTimeout = false,
    duration,
    heading,
    message,
    onClose,
    type,
    ...styleProps
  } = props

  const EXPANDED_STYLE = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slideup;
    overflow: hidden;

    @keyframes slideup {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0%);
      }
    }
  `

  const toastStyleByType: {
    [k in ToastType]: {
      iconName: IconName
      color: string
      backgroundColor: string
    }
  } = {
    [ALERT_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.yellow_two,
      backgroundColor: COLORS.yellow_four,
    },
    [ERROR_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.yellow_two,
      backgroundColor: COLORS.yellow_four,
    },
    [INFO_TOAST]: {
      iconName: 'check-circle',
      color: COLORS.green_two,
      backgroundColor: COLORS.green_four,
    },
    [SUCCESS_TOAST]: {
      iconName: 'check-circle',
      color: COLORS.green_two,
      backgroundColor: COLORS.green_four,
    },
    [WARNING_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.yellow_two,
      backgroundColor: COLORS.yellow_four,
    },
  }

  const headingText =
    heading !== undefined ? truncateString(heading, 45, 40) : null

  const calculatedDuration = (
    message: string,
    heading: string | null,
    duration: number | undefined
  ): number => {
    const messageDuration = message.length * 50
    const headingDuration = heading != null ? heading.length * 50 : 0
    const combinedDuration = messageDuration + headingDuration
    if (duration !== undefined) {
      return duration
    }
    if (combinedDuration < 2000) {
      return 2000
    }
    if (combinedDuration > 7000) {
      return 7000
    }
    return combinedDuration
  }

  if (!disableTimeout) {
    setTimeout(() => {
      onClose?.()
    }, calculatedDuration(message, headingText, duration))
  }

  return (
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.size_three}
      borderColor={toastStyleByType[type].color}
      borderWidth={BORDERS.size_one}
      border={BORDERS.styleSolid}
      backgroundColor={toastStyleByType[type].backgroundColor}
      // adjust padding when heading is present and creates extra column
      padding={`${String(SPACING.spacing4)} ${String(SPACING.spacing5)}`}
      data-testid={`Toast_${type}`}
      height="5.76rem"
      width="60rem"
      {...styleProps}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing2}
        overflow="hidden"
        width="100%"
      >
        <Icon
          name={toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          width={SPACING.spacing6}
          marginRight={SPACING.spacing3}
          aria-label={`icon_${type}`}
        />
        {headingText != null ? (
          <StyledText
            color={COLORS.darkBlackEnabled}
            fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            maxWidth="30.375rem"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {headingText}
          </StyledText>
        ) : null}
        <StyledText
          color={COLORS.darkBlack_hundred}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          whiteSpace="nowrap"
        >
          {message}
        </StyledText>
      </Flex>
      {closeButton === true && buttonText && buttonText.length > 0 && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <StyledText
            color={COLORS.darkBlack_hundred}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            whiteSpace="nowrap"
          >
            {buttonText}
          </StyledText>
        </Link>
      )}
    </Flex>
  )
}

export function Toast(props: ToastProps): JSX.Element {
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <>
      {isOnDevice != null && isOnDevice ? (
        <ODDToast {...props} />
      ) : (
        <DesktopToast {...props} />
      )}
    </>
  )
}
