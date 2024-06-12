import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  StyledText,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'

import type {
  DefaultTheme,
  FlattenSimpleInterpolation,
  ThemedCssFunction,
} from 'styled-components'
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
  exitNow?: boolean
  linkText?: string
  onLinkClick?: () => void
}

// TODO: (jh: 08/10/23) refactor toast component and render logic.

export const TOAST_ANIMATION_DURATION = 500

export function Toast(props: ToastProps): JSX.Element {
  const {
    buttonText,
    message,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
    duration = 7000,
    heading,
    displayType,
    exitNow = false,
    linkText,
    onLinkClick = () => null,
    ...styleProps
  } = props
  const { t } = useTranslation('shared')
  const [isClosed, setIsClosed] = React.useState<boolean>(exitNow)

  // We want to be able to storybook both the ODD and the Desktop versions,
  // so let it (and unit tests, for that matter) be able to pass in a parameter
  // that overrides the app's hardware selector.
  let showODDStyle = false
  if (displayType === 'desktop') {
    showODDStyle = false
  } else if (displayType === 'odd') {
    showODDStyle = true
  }

  let closeText: string | null = null
  if (buttonText != null) {
    closeText = buttonText
  } else if (closeButton) {
    if (displayType === 'odd') closeText = t('close')
    else closeText = ''
  }

  const ANIMATION_OVERFLOW = `
  overflow: hidden;
  `
  const ODD_ANIMATION_OPTIMIZATIONS = `
  backface-visibility: hidden;
  perspective: 1000;
  will-change: opacity, transform;
  `
  const DESKTOP_ANIMATION_SLIDE_UP_AND_IN = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slidein;
    ${ANIMATION_OVERFLOW}

    @keyframes slidein {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0%);
      }
    }
  `
  const DESKTOP_ANIMATION_SLIDE_DOWN_AND_OUT = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slideout;
    ${ANIMATION_OVERFLOW}

    @keyframes slideout {
      from {
        transform: translateX(0%);
      }
      to {
        transform: translateX(100%);
      }
    }
  `

  const desktopAnimation = isClosed
    ? DESKTOP_ANIMATION_SLIDE_DOWN_AND_OUT
    : DESKTOP_ANIMATION_SLIDE_UP_AND_IN

  const ODD_ANIMATION_SLIDE_UP_AND_IN = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slideup;
    ${ANIMATION_OVERFLOW}
    ${ODD_ANIMATION_OPTIMIZATIONS}

    @keyframes slideup {
      from {
        transform: translate3d(0%, 50%, 0);
        filter: opacity(0);
      }
      to {
        transform: translate3d(0%, 0%, 0);
        filter: opacity(100%);
      }
    }
  `
  const ODD_ANIMATION_SLIDE_DOWN_AND_OUT = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: slidedown;
    ${ANIMATION_OVERFLOW}
    ${ODD_ANIMATION_OPTIMIZATIONS}

    @keyframes slidedown {
      from {
        filter: opacity(100%);
      }
      to {
        filter: opacity(0);
      }
    }
  `
  const ODD_ANIMATION_FADE_UP_AND_OUT = css`
    animation-duration: ${TOAST_ANIMATION_DURATION}ms;
    animation-name: fadeUpAndOut;
    ${ANIMATION_OVERFLOW}
    ${ODD_ANIMATION_OPTIMIZATIONS}

    @keyframes fadeUpAndOut {
      from {
        filter: opacity(100%);
      }
      to {
        filter: opacity(0%);
      }
    }
  `

  const ODD_ANIMATION_NONE = css``

  const TEXT_STYLE = css`
    color: ${COLORS.black90};
    font-size: ${showODDStyle ? TYPOGRAPHY.fontSize22 : TYPOGRAPHY.fontSizeP};
    font-weight: ${showODDStyle
      ? TYPOGRAPHY.fontWeightSemiBold
      : TYPOGRAPHY.fontWeightRegular};
    line-height: ${showODDStyle
      ? TYPOGRAPHY.lineHeight28
      : TYPOGRAPHY.lineHeight20};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `

  let oddAnimation: FlattenSimpleInterpolation | ThemedCssFunction<DefaultTheme>

  if (isClosed) {
    if (exitNow) {
      oddAnimation = ODD_ANIMATION_FADE_UP_AND_OUT
    } else {
      oddAnimation = ODD_ANIMATION_SLIDE_DOWN_AND_OUT
    }
  } else {
    if (exitNow) {
      oddAnimation = ODD_ANIMATION_NONE
    } else {
      oddAnimation = ODD_ANIMATION_SLIDE_UP_AND_IN
    }
  }

  const toastStyleByType: {
    [k in ToastType]: {
      iconName: IconName
      color: string
      backgroundColor: string
    }
  } = {
    [ERROR_TOAST]: {
      iconName: 'ot-alert',
      color: COLORS.red60,
      backgroundColor: `${showODDStyle ? COLORS.red30 : COLORS.red20}`,
    },
    [INFO_TOAST]: {
      iconName: 'information',
      color: COLORS.blue60,
      backgroundColor: `${showODDStyle ? COLORS.blue30 : COLORS.blue20}`,
    },
    [SUCCESS_TOAST]: {
      iconName: 'ot-check',
      color: COLORS.green60,
      backgroundColor: `${showODDStyle ? COLORS.green30 : COLORS.green20}`,
    },
    [WARNING_TOAST]: {
      iconName: 'ot-alert',
      color: `${COLORS.yellow60}`,
      backgroundColor: `${showODDStyle ? COLORS.yellow30 : COLORS.yellow20}`,
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
    if (exitNow) return 0
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

  // Handle dismissal of toast when no timer is set.
  const onCloseHandler = (): void => {
    setIsClosed(true)
    setTimeout(() => {
      onClose?.()
    }, TOAST_ANIMATION_DURATION - 50)
  }

  const isAutomaticAnimationExit = !disableTimeout || exitNow

  if (isAutomaticAnimationExit) {
    setTimeout(() => {
      setIsClosed(true)
      setTimeout(() => {
        onClose?.()
      }, TOAST_ANIMATION_DURATION - 50)
    }, calculatedDuration(message, headingText, duration))
  }

  // Require intentional clicking if links and close button present on toast.
  const toastClose = (): void => {
    if (closeButton == null || linkText == null) onCloseHandler()
  }

  return (
    <Flex
      css={showODDStyle ? oddAnimation : desktopAnimation}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={
        showODDStyle ? BORDERS.borderRadius8 : BORDERS.borderRadius4
      }
      borderColor={toastStyleByType[type].color}
      borderWidth={showODDStyle ? BORDERS.borderRadius4 : '1px'}
      border={BORDERS.styleSolid}
      boxShadow={BORDERS.shadowBig}
      backgroundColor={toastStyleByType[type].backgroundColor}
      onClick={toastClose}
      // adjust padding when heading is present and creates extra column
      padding={
        showODDStyle
          ? `${SPACING.spacing16} ${SPACING.spacing24}`
          : `${heading != null ? SPACING.spacing4 : SPACING.spacing8} ${
              SPACING.spacing8
            } ${heading != null ? SPACING.spacing4 : SPACING.spacing8} ${
              SPACING.spacing12
            }`
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
        gridGap={SPACING.spacing8}
        overflow="hidden"
        width="100%"
      >
        <Icon
          name={icon?.name ?? toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          maxWidth={showODDStyle ? SPACING.spacing32 : SPACING.spacing16}
          minWidth={showODDStyle ? SPACING.spacing32 : SPACING.spacing16}
          marginRight={showODDStyle ? SPACING.spacing8 : '0'}
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
              color={COLORS.black90}
              fontSize={
                showODDStyle ? TYPOGRAPHY.fontSize22 : TYPOGRAPHY.fontSizeP
              }
              fontWeight={
                showODDStyle
                  ? TYPOGRAPHY.fontWeightBold
                  : TYPOGRAPHY.fontWeightRegular
              }
              lineHeight={
                showODDStyle ? TYPOGRAPHY.lineHeight28 : TYPOGRAPHY.lineHeight20
              }
              marginRight={showODDStyle ? SPACING.spacing4 : undefined}
              maxWidth={showODDStyle ? '30.375rem' : 'auto'}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {headingText}
            </StyledText>
          ) : null}
          <Flex alignItems={ALIGN_CENTER}>
            <StyledText css={TEXT_STYLE}>{message}</StyledText>
            {linkText ? (
              <Link
                role="button"
                onClick={() => {
                  onLinkClick()
                  onCloseHandler()
                }}
                css={TEXT_STYLE}
                marginLeft={SPACING.spacing4}
                marginRight={SPACING.spacing8}
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
              >
                {linkText}
              </Link>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
      {closeText ? (
        <Link
          role="button"
          onClick={() => {
            onCloseHandler()
          }}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        >
          <StyledText
            color={COLORS.black90}
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
            textDecoration={
              showODDStyle ? 'none' : TYPOGRAPHY.textDecorationUnderline
            }
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            whiteSpace="nowrap"
          >
            {closeText}
          </StyledText>
        </Link>
      ) : null}
      {!closeText && closeButton ? (
        <Btn
          onClick={() => {
            onCloseHandler()
          }}
        >
          <Icon
            width={SPACING.spacing24}
            height={SPACING.spacing24}
            marginTop={SPACING.spacing6}
            name="close"
            aria-label="close_icon"
          />
        </Btn>
      ) : null}
    </Flex>
  )
}
