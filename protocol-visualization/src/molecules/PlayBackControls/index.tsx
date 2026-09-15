import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Icon,
  NewIconButton,
  StyledText,
  TimelineScrubber,
} from '@opentrons/components'

import { PerStepOverflowMenu } from '../PerStepOverflowMenu'
import styles from './playbackcontrols.module.css'
import { getSpeedMultiplierText } from './utils/getSpeedMultiplierText'
import { isEditableKeyboardTarget } from './utils/isEditableKeyboardTarget'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'

interface PlayBackControlsProps {
  isPlaying: boolean
  handlePlayPause: () => void
  currentCommandIndex: number
  numCommandLength: number
  commands: RunTimeCommand[]
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  milliSecondsPerFrame: number
  setMilliSecondsPerFrame: Dispatch<SetStateAction<number>>
  onClickStepDetail?: () => void
}

export function PlayBackControls(props: PlayBackControlsProps): ReactNode {
  const {
    isPlaying,
    handlePlayPause,
    currentCommandIndex,
    numCommandLength,
    commands,
    setSelectedCommand,
    milliSecondsPerFrame,
    setMilliSecondsPerFrame,
    // onClickStepDetail,
  } = props

  const { t } = useTranslation('protocol_visualization')
  const [showPerStepOverflowMenu, setShowPerStepOverflowMenu] = useState(false)

  const handlePerStepOverflowClick = (): void => {
    setShowPerStepOverflowMenu(prev => !prev)
  }

  const handleTrackChange = (updatedTrack: {
    id: string
    value: number
  }): void => {
    if (numCommandLength <= 1) {
      return
    }

    const normalizedValue = updatedTrack.value / 100
    const nextIndex = Math.min(
      Math.max(Math.round(normalizedValue * (numCommandLength - 1)), 0),
      numCommandLength - 1
    )

    const nextCommandId = commands[nextIndex]?.id
    if (nextCommandId != null) {
      setSelectedCommand(nextCommandId)
    }
  }

  const currentProgress =
    numCommandLength > 1
      ? (currentCommandIndex / (numCommandLength - 1)) * 100
      : 0
  const tracks = [
    {
      id: 'protocol-timeline',
      value: currentProgress,
    },
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== ' ') {
        return
      }

      if (isEditableKeyboardTarget(event.target)) {
        return
      }

      event.preventDefault()
      handlePlayPause()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause])

  return (
    <div className={styles.container}>
      <div className={styles.controls_left}>
        {/* play/pause button */}
        <NewIconButton
          variant="primary"
          iconName={isPlaying ? 'pause' : 'play'}
          onClick={handlePlayPause}
          aria-label={isPlaying ? t('pause') : t('play')}
        />

        {/* time slider */}
        <div className={styles.slider_wrapper}>
          <TimelineScrubber tracks={tracks} onTrackChange={handleTrackChange} />
        </div>

        {/* speed switch */}
        <div className={styles.speed_wrapper}>
          <button
            type="button"
            className={styles.speed_button}
            onClick={handlePerStepOverflowClick}
          >
            <StyledText desktopStyle="captionSemiBold">
              {getSpeedMultiplierText(milliSecondsPerFrame)}
            </StyledText>
          </button>

          {showPerStepOverflowMenu && (
            <PerStepOverflowMenu
              setShowPerStepOverflowMenu={setShowPerStepOverflowMenu}
              setMilliSecondsPerFrame={setMilliSecondsPerFrame}
            />
          )}
        </div>
      </div>
      {/* divider */}
      <div className={styles.divider} />
      {/* right edge */}
      <div className={styles.controls_right}>
        <button
          type="button"
          onClick={() => {}}
          className={styles.icon_button}
          aria-label={t('step_details')}
        >
          <Icon name="step-detail" size="1rem" />
        </button>
      </div>
    </div>
  )
}
