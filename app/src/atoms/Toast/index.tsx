import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
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

import type { IconName, IconProps, StyleProps } from '@opentrons/components'

export const SUCCESS_TOAST: 'success' = 'success'
export const WARNING_TOAST: 'warning' = 'warning'
export const ERROR_TOAST: 'error' = 'error'
export const INFO_TOAST: 'info' = 'info'

export type ToastType =
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
  displayType?: 'desktop' | 'odd'
}

const TOAST_ANIMATION_DURATION = 500

export function Toast(props: ToastProps): JSX.Element {
  const {
    buttonText,
    message,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
    duration = 8000,
    heading,
    displayType,
    ...styleProps
  } = props
  const { t } = useTranslation('shared')

  // We want to be able to storybook both the ODD and the Desktop versions,
  // so let it (and unit tests, for that matter) be able to pass in a parameter
  // that overrides the app's hardware selector.
  let showODDStyle = false
  if (displayType === 'desktop') {
    showODDStyle = false
  } else if (displayType === 'odd') {
    showODDStyle = true
  }

  const closeText =
    buttonText !== undefined && buttonText.length > 0
      ? buttonText
      : closeButton === true
      ? t('close')
      : ''
  const DESKTOP_ANIMATION = css`
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
  const ODD_ANIMATION = css`
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
    [ERROR_TOAST]: {
      iconName: 'alert-circle',
      color: `${showODDStyle ? COLORS.yellow_two : COLORS.errorEnabled}`,
      backgroundColor: `${
        showODDStyle ? COLORS.yellow_four : COLORS.errorBackgroundLight
      }`,
    },
    [INFO_TOAST]: {
      iconName: 'information',
      color: COLORS.darkGreyEnabled,
      backgroundColor: COLORS.darkGreyDisabled,
    },
    [SUCCESS_TOAST]: {
      iconName: 'check-circle',
      color: `${showODDStyle ? COLORS.green_two : COLORS.successEnabled}`,
      backgroundColor: `${
        showODDStyle ? COLORS.green_four : COLORS.successBackgroundLight
      }`,
    },
    [WARNING_TOAST]: {
      iconName: 'alert-circle',
      color: COLORS.warningEnabled,
      backgroundColor: COLORS.warningBackgroundLight,
    },
  }

  const headingText =
    heading !== undefined
      ? showODDStyle
        ? truncateString(heading, 45, 40)
        : heading
      : ''

  const calculatedDuration = (
    message: string,
    heading: string,
    duration: number | undefined
  ): number => {
    const combinedDuration = (message.length + heading.length) * 50
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
      css={showODDStyle ? ODD_ANIMATION : DESKTOP_ANIMATION}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={
        showODDStyle ? BORDERS.size_three : BORDERS.radiusSoftCorners
      }
      borderColor={toastStyleByType[type].color}
      borderWidth={showODDStyle ? BORDERS.size_one : SPACING.spacingXXS}
      border={BORDERS.styleSolid}
      backgroundColor={toastStyleByType[type].backgroundColor}
      // adjust padding when heading is present and creates extra column
      padding={
        showODDStyle
          ? `${String(SPACING.spacing4)} ${String(SPACING.spacing5)}`
          : `${heading != null ? SPACING.spacing2 : SPACING.spacing3} ${
              SPACING.spacing3
            } ${heading != null ? SPACING.spacing2 : SPACING.spacing3} 0.75rem`
      }
      data-testid={`Toast_${type}`}
      height={showODDStyle ? '5.76rem' : 'auto'}
      maxWidth={showODDStyle ? '60rem' : '88%'}
      minWidth={showODDStyle ? '60rem' : '24rem'}
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
          name={icon?.name ?? toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          width={showODDStyle ? SPACING.spacing6 : SPACING.spacing4}
          marginRight={showODDStyle ? SPACING.spacing3 : SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
          aria-label={`icon_${type}`}
        />
        <Flex
          flexDirection={showODDStyle ? DIRECTION_ROW : DIRECTION_COLUMN}
          overflow="hidden"
          width={showODDStyle ? 'auto' : '100%'}
        >
          {headingText.length > 0 ? (
            <StyledText
              color={COLORS.darkBlackEnabled}
              fontSize={
                showODDStyle ? TYPOGRAPHY.fontSize22 : TYPOGRAPHY.fontSizeP
              }
              fontWeight={
                showODDStyle
                  ? TYPOGRAPHY.fontWeightLevel2_bold
                  : TYPOGRAPHY.fontWeightRegular
              }
              lineHeight={
                showODDStyle ? TYPOGRAPHY.lineHeight28 : TYPOGRAPHY.lineHeight20
              }
              maxWidth={showODDStyle ? '30.375rem' : 'auto'}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {headingText}
            </StyledText>
          ) : null}
          <StyledText
            color={
              showODDStyle ? COLORS.darkBlack_hundred : COLORS.darkBlackEnabled
            }
            fontSize={
              showODDStyle ? TYPOGRAPHY.fontSize22 : TYPOGRAPHY.fontSizeP
            }
            fontWeight={
              showODDStyle
                ? TYPOGRAPHY.fontWeightSemiBold
                : TYPOGRAPHY.fontWeightRegular
            }
            lineHeight={
              showODDStyle ? TYPOGRAPHY.lineHeight28 : TYPOGRAPHY.lineHeight20
            }
            whiteSpace="nowrap"
          >
            {message}
          </StyledText>
        </Flex>
      </Flex>
      {closeText.length > 0 && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <StyledText
            color={COLORS.darkBlack_hundred}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            whiteSpace="nowrap"
          >
            {closeText}
          </StyledText>
        </Link>
      )}
    </Flex>
  )
}
