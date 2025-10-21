import styled from 'styled-components'

import {
  BORDERS,
  Btn,
  COLORS,
  CURSOR_DEFAULT,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { MouseEventHandler } from 'react'

interface TouchControlProps {
  text1: string
  isActive: boolean
  onClick?: MouseEventHandler
  text2?: string
}

const StyledTouchButton = styled(Btn)<{ isActive: boolean }>`
  background-color: ${COLORS.white};
  border: ${({ isActive }) =>
    isActive ? `1px ${COLORS.blue50} solid` : `1px ${COLORS.grey30} solid`};
  height: 3.62rem;
  color: ${COLORS.black90};
  cursor: ${CURSOR_DEFAULT};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing20};

  &:focus {
    background-color: ${COLORS.white};
    color: ${COLORS.black90};
    border: 1px ${COLORS.blue50} solid;
  }

  &:hover {
    background-color: ${COLORS.white};
    color: ${COLORS.black90};
  }

  &:active {
    color: ${COLORS.black90};
    border: 1px ${COLORS.blue50} solid;
  }

  &:focus-visible {
    color: ${COLORS.blue50};
    background-color: ${COLORS.white};
    border: 1px ${COLORS.blue50} solid;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
    outline-offset: 3px;
  }

  &:disabled {
    background-color: inherit;
    color: ${COLORS.grey40};
  }
`

export function TouchControlButton(props: TouchControlProps): JSX.Element {
  const { text1, text2, isActive, onClick } = props
  return (
    <StyledTouchButton isActive={isActive} onClick={onClick}>
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={isActive ? COLORS.blue50 : COLORS.black90}
      >
        {text1}
      </StyledText>
      <StyledText fontWeight={TYPOGRAPHY.labelRegular} color={COLORS.grey60}>
        {text2}
      </StyledText>
    </StyledTouchButton>
  )
}
