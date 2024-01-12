import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  LEGACY_COLORS,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  Icon,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

// ToDo (kk:10/17/2023) This component will be modified more later.
// This is the initial step to reduce ProtocolSetup component's code.
// For PlayButton, we can extend the play button that is existing under RunningProtocol
// For CloseButton we can would be able to use the close button that is existing under RunningProtocol
interface PlayButtonProps {
  ready: boolean
  onPlay?: () => void
  disabled?: boolean
  isDoorOpen: boolean
}

export function PlayButton({
  disabled = false,
  onPlay,
  ready,
  isDoorOpen,
}: PlayButtonProps): JSX.Element {
  const playButtonStyle = css`
    -webkit-tap-highlight-color: transparent;
    &:focus {
      background-color: ${ready && !isDoorOpen
        ? COLORS.blue60
        : COLORS.grey50};
      color: ${COLORS.white};
    }

    &:hover {
      background-color: ${ready && !isDoorOpen
        ? COLORS.blue50
        : COLORS.grey35};
      color: ${COLORS.white};
    }

    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
      background-color: ${ready && !isDoorOpen
        ? COLORS.blue50
        : COLORS.grey35};
    }

    &:active {
      background-color: ${ready && !isDoorOpen
        ? COLORS.blue60
        : COLORS.grey50};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: ${COLORS.grey35};
      color: ${COLORS.grey50};
    }
  `
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={
        disabled || !ready || isDoorOpen
          ? COLORS.grey35
          : COLORS.blue50
      }
      borderRadius="6.25rem"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      disabled={disabled}
      onClick={onPlay}
      aria-label="play"
      css={playButtonStyle}
    >
      <Icon
        color={
          disabled || !ready || isDoorOpen
            ? COLORS.grey50
            : COLORS.white
        }
        name="play-icon"
        size="2.5rem"
      />
    </Btn>
  )
}

interface CloseButtonProps {
  onClose: () => void
}

export function CloseButton({ onClose }: CloseButtonProps): JSX.Element {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.red50}
      borderRadius="6.25rem"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      onClick={onClose}
      aria-label="close"
      css={CLOSE_BUTTON_STYLE}
    >
      <Icon color={COLORS.white} name="close-icon" size="2.5rem" />
    </Btn>
  )
}

const CLOSE_BUTTON_STYLE = css`
  -webkit-tap-highlight-color: transparent;
  &:focus {
    background-color: ${COLORS.red55};
    color: ${COLORS.white};
  }

  &:hover {
    background-color: ${COLORS.red50};
    color: ${COLORS.white};
  }

  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.red50};
  }

  &:active {
    background-color: ${COLORS.red55};
    color: ${COLORS.white};
  }

  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
  }
`
