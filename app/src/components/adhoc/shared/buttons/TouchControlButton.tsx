import styled from 'styled-components'

import {
  BORDERS,
  Btn,
  COLORS,
  CURSOR_POINTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface TouchControlProps {
  title: string
  isActive: boolean
  onClick: () => void
  isOnDevice: boolean
  subText?: string
}

const getBgColor = (isActive: boolean, isOnDevice: boolean): string => {
  if (!isOnDevice) {
    return COLORS.white
  }

  if (isActive) {
    return COLORS.blue50
  }

  return COLORS.blue35
}

const getBorderColor = (isActive: boolean, isOnDevice: boolean): string => {
  if (!isOnDevice) {
    if (isActive) {
      return COLORS.blue50
    }
    return COLORS.grey30
  }

  return COLORS.grey30
}

const getFocusBorderColor = (
  isActive: boolean,
  isOnDevice: boolean
): string => {
  if (!isOnDevice) {
    if (isActive) {
      return COLORS.blue50
    }
    return COLORS.grey30
  }

  return COLORS.white
}

const StyledTouchButton = styled(Btn)<{
  isActive: boolean
  isOnDevice: boolean
}>`
  background-color: ${({ isActive, isOnDevice }) =>
    getBgColor(isActive, isOnDevice)};

  border: ${({ isActive, isOnDevice }) =>
    `1px ${getBorderColor(isActive, isOnDevice)} solid`};

  cursor: ${CURSOR_POINTER};
  border-radius: ${({ isOnDevice }) =>
    isOnDevice ? BORDERS.borderRadius16 : BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing20};
  text-align: ${({ isOnDevice }) => (isOnDevice ? 'left' : 'center')};

  &:focus {
    background-color: ${({ isActive, isOnDevice }) =>
      getBgColor(isActive, isOnDevice)};

    border: ${({ isActive, isOnDevice }) =>
      `1px ${getFocusBorderColor(isActive, isOnDevice)} solid`};
  }

  &:active {
    background-color: ${({ isActive, isOnDevice }) =>
      getBgColor(isActive, isOnDevice)};

    color: ${COLORS.blue50};
    border: 1px ${COLORS.blue50} solid;
  }

  &:focus-visible {
    ${({ isOnDevice }) =>
      !isOnDevice &&
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

export function TouchControlButton(props: TouchControlProps): ReactNode {
  const { title, isActive, onClick, subText, isOnDevice } = props
  return (
    <StyledTouchButton
      isActive={isActive}
      isOnDevice={isOnDevice}
      onClick={onClick}
    >
      <StyledText
        oddStyle="bodyTextSemiBold"
        desktopStyle="bodyDefaultSemiBold"
        color={
          isActive && !isOnDevice
            ? COLORS.blue50
            : isOnDevice && isActive
              ? COLORS.white
              : COLORS.black90
        }
      >
        {title}
      </StyledText>

      {subText && (
        <StyledText
          oddStyle="bodyTextRegular"
          desktopStyle="captionRegular"
          color={isActive && isOnDevice ? COLORS.white : COLORS.grey60}
        >
          {subText}
        </StyledText>
      )}
    </StyledTouchButton>
  )
}
