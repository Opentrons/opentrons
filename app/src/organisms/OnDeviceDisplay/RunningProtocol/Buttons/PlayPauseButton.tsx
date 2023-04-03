import * as React from 'react'
import { css } from 'styled-components'

import {
  Btn,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import type { RunStatus } from '@opentrons/api-client'

const PLAY_PAUSE_BUTTON_STYLE = css`
  display: flex;
  height: 12.5rem;
  width: 12.5rem;
  border-radius: 50%;
  background-color: ${COLORS.blueEnabled};

  &:focus {
    background-color: ${COLORS.bluePressed};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blueEnabled};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 ${SPACING.spacing1} ${COLORS.fundamentalsFocus};
    background-color: ${COLORS.blueEnabled};
  }
  &:active {
    background-color: ${COLORS.bluePressed};
  }
  &:disabled {
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_sixty};
  }
`

interface PlayPauseButtonProps {
  onTogglePlayPause?: () => void
  runStatus?: RunStatus | null
}

export function PlayPauseButton({
  onTogglePlayPause,
  runStatus,
}: PlayPauseButtonProps): JSX.Element {
  const isRunning = runStatus === RUN_STATUS_RUNNING
  const iconName = isRunning ? 'pause' : 'play'
  return (
    <Btn
      css={PLAY_PAUSE_BUTTON_STYLE}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      onClick={onTogglePlayPause}
      aria-label={isRunning ? 'pause' : 'play'}
    >
      <Icon name={iconName} color={COLORS.white} size="5rem" />
    </Btn>
  )
}
