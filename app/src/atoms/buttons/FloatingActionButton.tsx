import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Btn,
  Flex,
  Icon,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  POSITION_FIXED,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../text'

import type { IconName, StyleProps } from '@opentrons/components'

interface FloatingActionButtonProps extends StyleProps {
  buttonText?: React.ReactNode
  disabled?: boolean
  iconName?: IconName
  onClick: React.MouseEventHandler
}

export function FloatingActionButton(
  props: FloatingActionButtonProps
): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const {
    buttonText = t('map_view'),
    disabled = false,
    iconName = 'deck-map',
    ...buttonProps
  } = props

  const contentColor = disabled ? COLORS.darkBlack60 : COLORS.white
  const FLOATING_ACTION_BUTTON_STYLE = css`
    background-color: ${COLORS.highlightPurple1};
    border-radius: ${BORDERS.borderRadiusSize5};
    box-shadow: ${BORDERS.shadowBig};
    color: ${contentColor};
    cursor: default;

    &:active {
      background-color: ${COLORS.highlightPurple1Pressed};
    }

    &:focus-visible {
      border-color: ${COLORS.fundamentalsFocus};
      border-width: ${SPACING.spacing4};
      box-shadow: ${BORDERS.shadowBig};
    }

    &:disabled {
      background-color: ${COLORS.darkBlack20};
      color: ${contentColor};
    }
  `

  return (
    <Btn
      bottom={SPACING.spacing24}
      css={FLOATING_ACTION_BUTTON_STYLE}
      disabled={disabled}
      fontSize={TYPOGRAPHY.fontSize28}
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      lineHeight={TYPOGRAPHY.lineHeight36}
      padding={`${SPACING.spacing12} ${SPACING.spacing24}`}
      position={POSITION_FIXED}
      right={SPACING.spacing24}
      {...buttonProps}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing8}
      >
        <Icon
          color={contentColor}
          height="3rem"
          name={iconName}
          width="3.75rem"
        />
        <StyledText>{buttonText}</StyledText>
      </Flex>
    </Btn>
  )
}
