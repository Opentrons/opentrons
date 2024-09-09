import * as React from 'react'
import { Flex } from '../../primitives'
import {
  BORDERS,
  COLORS,
  Icon,
  SPACING,
  StyledText,
  Btn,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  ALIGN_CENTER,
  FLEX_MAX_CONTENT,
} from '../..'
import type { IconName } from '../..'
import { css } from 'styled-components'

interface EmptySelectorButtonProps {
  onClick: () => void
  text: string
  textAlignment: 'left' | 'middle'
  iconName?: IconName
  size?: 'large' | 'small'
  disabled?: boolean
}

//  used for helix and Opentrons Ai
export function EmptySelectorButton(
  props: EmptySelectorButtonProps
): JSX.Element {
  const {
    onClick,
    text,
    iconName,
    size = 'large',
    textAlignment,
    disabled = false,
  } = props
  const buttonSizing = size === 'large' ? '100%' : FLEX_MAX_CONTENT

  return (
    <Btn
      onClick={onClick}
      width={buttonSizing}
      height={buttonSizing}
      css={css`
        &:focus-visible {
          outline: 2px solid ${COLORS.white};
          box-shadow: 0 0 0 4px ${COLORS.blue50};
          border-radius: ${BORDERS.borderRadius8};
        }
      `}
    >
      <Flex
        gridGap={SPACING.spacing4}
        padding={SPACING.spacing12}
        backgroundColor={disabled ? COLORS.grey30 : COLORS.blue30}
        color={disabled ? COLORS.grey40 : COLORS.black90}
        borderRadius={BORDERS.borderRadius8}
        border={`2px dashed ${disabled ? COLORS.grey40 : COLORS.blue50}`}
        width="100%"
        height="100%"
        alignItems={ALIGN_CENTER}
        data-testid="EmptySelectorButton_container"
        justifyContent={
          textAlignment === 'middle' ? JUSTIFY_CENTER : JUSTIFY_START
        }
      >
        {iconName != null ? (
          <Icon
            name={iconName}
            size="1.25rem"
            data-testid={`EmptySelectorButton_${iconName}`}
          />
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{text}</StyledText>
      </Flex>
    </Btn>
  )
}
