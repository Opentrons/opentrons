import * as React from 'react'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  BORDER_STYLE_SOLID,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
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
  message: string | JSX.Element
  type: ToastType
  icon?: IconProps
  closeButton?: boolean
  onClose?: () => void
  disableTimeout?: boolean
  duration?: number
}

const TOAST_ANIMATION_DURATION = 500

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
  [ERROR_TOAST]: {
    iconName: 'alert-circle',
    color: COLORS.errorEnabled,
    backgroundColor: COLORS.errorBackgroundLight,
  },
  [WARNING_TOAST]: {
    iconName: 'alert-circle',
    color: COLORS.warningEnabled,
    backgroundColor: COLORS.warningBackgroundLight,
  },
  [SUCCESS_TOAST]: {
    iconName: 'check-circle',
    color: COLORS.successEnabled,
    backgroundColor: COLORS.successBackgroundLight,
  },
  [INFO_TOAST]: {
    iconName: 'information',
    color: COLORS.darkGreyEnabled,
    backgroundColor: COLORS.darkGreyDisabled,
  },
}

export function Toast(props: ToastProps): JSX.Element {
  const {
    message,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
    duration = 8000,
    ...styleProps
  } = props

  if (!disableTimeout) {
    setTimeout(() => {
      onClose?.()
    }, duration)
  }

  return (
    // maxWidth is based on default app size ratio
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.radiusSoftCorners}
      borderColor={toastStyleByType[type].color}
      borderWidth={SPACING.spacingXXS}
      border={BORDER_STYLE_SOLID}
      backgroundColor={toastStyleByType[type].backgroundColor}
      padding={`${SPACING.spacing3} ${SPACING.spacing3} ${SPACING.spacing3} 0.75rem`}
      data-testid={`Toast_${type}`}
      maxWidth="88%"
      minWidth="fit-content"
      {...styleProps}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <Icon
          name={icon?.name ?? toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          width={SPACING.spacing4}
          marginRight={SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
          aria-label={`icon_${type}`}
        />
        <StyledText as="p">{message}</StyledText>
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
