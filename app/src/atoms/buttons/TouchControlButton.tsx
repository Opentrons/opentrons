import { useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  BORDERS,
  Btn,
  COLORS,
  CURSOR_DEFAULT,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getIsOnDevice } from '/app/redux/config'

import type { MouseEventHandler } from 'react'

interface TouchControlProps {
  text1: string
  isActive: boolean
  onClick?: MouseEventHandler
  text2?: string
}

const StyledTouchButton = styled(Btn)<{ isActive: boolean; isOnOdd: boolean }>`
  background-color: ${({ isActive, isOnOdd }) =>
    !isOnOdd ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};
  border: ${({ isActive, isOnOdd }) =>
    !isOnOdd
      ? isActive
        ? `1px ${COLORS.blue50} solid`
        : `1px ${COLORS.grey30} solid`
      : `1px ${COLORS.grey30} solid`};
  cursor: ${CURSOR_DEFAULT};
  border-radius: ${({ isOnOdd }) =>
    isOnOdd ? BORDERS.borderRadius16 : BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing20};
  text-align: ${({ isOnOdd }) => (isOnOdd ? 'left' : 'center')};

  &:focus {
    background-color: ${({ isActive, isOnOdd }) =>
      !isOnOdd ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};
    border: ${({ isActive, isOnOdd }) =>
      !isOnOdd
        ? isActive
          ? `1px ${COLORS.blue50} solid`
          : `1px ${COLORS.grey30} solid`
        : `1px ${COLORS.white} solid`};
  }

  &:active {
    background-color: ${({ isActive, isOnOdd }) =>
      !isOnOdd ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};
    color: ${COLORS.blue50};
    border: 1px ${COLORS.blue50} solid;
  }

  &:focus-visible {
    ${({ isOnOdd }) =>
      !isOnOdd &&
      `
        color: ${COLORS.blue50};
        background-color: ${COLORS.white};
        border: 1px solid ${COLORS.blue50};
        outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
        outline-offset: 3px;
      `}
  }

  &:disabled {
    background-color: inherit;
    color: ${COLORS.grey40};
  }
`

export function TouchControlButton(props: TouchControlProps): JSX.Element {
  const { text1, text2, isActive, onClick } = props
  const isOnOdd = useSelector(getIsOnDevice)
  return (
    <StyledTouchButton isActive={isActive} onClick={onClick} isOnOdd={isOnOdd}>
      <StyledText
        oddStyle={'bodyTextSemiBold'}
        desktopStyle={'bodyDefaultSemiBold'}
        color={
          isActive && !isOnOdd
            ? COLORS.blue50
            : isOnOdd && isActive
              ? COLORS.white
              : COLORS.black90
        }
      >
        {text1}
      </StyledText>
      <StyledText
        oddStyle={'bodyTextRegular'}
        desktopStyle={'captionRegular'}
        color={isActive && isOnOdd ? COLORS.white : COLORS.grey60}
      >
        {text2}
      </StyledText>
    </StyledTouchButton>
  )
}
