import styled from 'styled-components'

import {
  BORDERS,
  Btn,
  COLORS,
  CURSOR_DEFAULT,
  SPACING,
  StyledText,
} from '@opentrons/components'

interface TouchControlProps {
  title: string
  isActive: boolean
  onClick: () => void
  isOnDevice: boolean
  subText?: string
}

const StyledTouchButton = styled(Btn)<{
  isActive: boolean
  isOnDevice: boolean
}>`
  background-color: ${({ isActive, isOnDevice }) =>
    !isOnDevice ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};

  border: ${({ isActive, isOnDevice }) =>
    !isOnDevice
      ? isActive
        ? `1px ${COLORS.blue50} solid`
        : `1px ${COLORS.grey30} solid`
      : `1px ${COLORS.grey30} solid`};

  cursor: ${CURSOR_DEFAULT};
  border-radius: ${({ isOnDevice }) =>
    isOnDevice ? BORDERS.borderRadius16 : BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing20};
  text-align: ${({ isOnDevice }) => (isOnDevice ? 'left' : 'center')};

  &:focus {
    background-color: ${({ isActive, isOnDevice }) =>
      !isOnDevice ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};
    border: ${({ isActive, isOnDevice }) =>
      !isOnDevice
        ? isActive
          ? `1px ${COLORS.blue50} solid`
          : `1px ${COLORS.grey30} solid`
        : `1px ${COLORS.white} solid`};
  }

  &:active {
    background-color: ${({ isActive, isOnDevice }) =>
      !isOnDevice ? COLORS.white : isActive ? COLORS.blue50 : COLORS.blue35};
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
export const TouchControlButton = (props: TouchControlProps): JSX.Element => {
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
