import * as React from 'react'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../text'

import type { IconName, StyleProps } from '@opentrons/components'

export const ALERT_ODD_TOAST: 'alert' = 'alert'
export const SUCCESS_ODD_TOAST: 'success' = 'success'

export type ODDToastType = typeof ALERT_ODD_TOAST | typeof SUCCESS_ODD_TOAST

export interface ODDToastProps extends StyleProps {
  id: string
  message: string
  secondaryText?: string
  type: ODDToastType
  buttonText?: string
  onClose?: () => void
  disableTimeout?: boolean
  duration?: number
}

const TOAST_ANIMATION_DURATION = 500

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

// TODO(bh: 2022-12-1): implement css for toast removal -
// a bit complicated because removal removes the element from the DOM immediately
// a library like react-transition-group is a possible solution

const toastODDStyleByType: {
  [k in ODDToastType]: {
    iconName: IconName
    color: string
    backgroundColor: string
  }
} = {
  [ALERT_ODD_TOAST]: {
    iconName: 'alert-circle',
    color: COLORS.yellow_two,
    backgroundColor: COLORS.yellow_four,
  },
  [SUCCESS_ODD_TOAST]: {
    iconName: 'check-circle',
    color: COLORS.green_two,
    backgroundColor: COLORS.green_four,
  },
}

export function ODDToast(props: ODDToastProps): JSX.Element {
  const {
    message,
    secondaryText,
    type,
    buttonText = '',
    onClose,
    disableTimeout = false,
    duration,
    ...styleProps
  } = props

  const secondary =
    secondaryText !== undefined ? truncateString(secondaryText, 45, 40) : null

  const calculatedDuration = (
    message: string,
    secondary: string | null,
    duration: number | undefined
  ): number => {
    const primaryDuration = message.length * 50
    const secondaryDuration = secondary != null ? secondary.length * 50 : 0
    const combinedDuration = primaryDuration + secondaryDuration
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
    }, calculatedDuration(message, secondary, duration))
  }

  return (
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.size_three}
      borderColor={toastODDStyleByType[type].color}
      borderWidth={BORDERS.size_one}
      border={BORDERS.styleSolid}
      backgroundColor={toastODDStyleByType[type].backgroundColor}
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
          name={toastODDStyleByType[type].iconName}
          color={toastODDStyleByType[type].color}
          width={SPACING.spacing6}
          marginRight={SPACING.spacing3}
          aria-label={`icon_${type}`}
        />
        <StyledText
          color={COLORS.darkBlack_hundred}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          whiteSpace="nowrap"
        >
          {message}
        </StyledText>
        {secondary != null ? (
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
            {secondary}
          </StyledText>
        ) : null}
      </Flex>
      {buttonText.length > 0 && (
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
