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
import {
  ALERT_TOAST,
  SUCCESS_TOAST,
  ERROR_TOAST,
  WARNING_TOAST,
  INFO_TOAST,
} from '..'

import type { IconName } from '@opentrons/components'
import type { ToastType, ToastProps } from '..'

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

// ODD only has Alert and Success. Retrofitting old types into those two.
const toastODDStyleByType: {
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
  [SUCCESS_TOAST]: {
    iconName: 'check-circle',
    color: COLORS.green_two,
    backgroundColor: COLORS.green_four,
  },
  [ERROR_TOAST]: {
    iconName: 'alert-circle',
    color: COLORS.yellow_two,
    backgroundColor: COLORS.yellow_four,
  },
  [WARNING_TOAST]: {
    iconName: 'alert-circle',
    color: COLORS.yellow_two,
    backgroundColor: COLORS.yellow_four,
  },
  [INFO_TOAST]: {
    iconName: 'check-circle',
    color: COLORS.green_two,
    backgroundColor: COLORS.green_four,
  },
}

export function Toast(props: ToastProps): JSX.Element {
  const {
    message,
    secondaryMessage,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
    duration = 5000,
    heading,
    ...styleProps
  } = props

  const secondary =
    secondaryMessage !== undefined
      ? truncateString(secondaryMessage, 45, 40)
      : null

  if (!disableTimeout) {
    setTimeout(() => {
      onClose?.()
    }, duration)
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
      padding={`${SPACING.spacing4} ${SPACING.spacing5}`}
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
          name={icon?.name ?? toastODDStyleByType[type].iconName}
          color={toastODDStyleByType[type].color}
          width={SPACING.spacing6}
          marginRight={SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
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
      {typeof closeButton === 'string' && closeButton.length > 0 && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <StyledText
            color={COLORS.darkBlack_hundred}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            whiteSpace="nowrap"
          >
            {closeButton}
          </StyledText>
        </Link>
      )}
    </Flex>
  )
}
