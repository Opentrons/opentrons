import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Chip,
  COLORS,
  NewIconButton,
  NO_WRAP,
  StyledText,
  TertiaryButton,
  TimelineScrubber,
} from '@opentrons/components'

import styles from './controls.module.css'
import { PerStepOverflowMenu } from './PerStepOverflowMenu'

// import {
//   getNextGroupFirstCommandId,
//   getPreviousGroupFirstCommandId,
// } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface ControlsProps {
  numErrors: number
  protocolName: string
  numCommandLength: number
  currentCommandIndex: number
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  handlePlayPause: () => void
  isPlaying: boolean
  commands: RunTimeCommand[]
  groupedCommands: GroupedCommands | null
  milliSecondsPerFrame: number
  setMilliSecondsPerFrame: Dispatch<SetStateAction<number>>
}
export function Controls(props: ControlsProps): JSX.Element {
  const {
    numErrors,
    protocolName,
    numCommandLength,
    currentCommandIndex,
    setSelectedCommand,
    handlePlayPause,
    isPlaying,
    commands,
    milliSecondsPerFrame,
    setMilliSecondsPerFrame,
  } = props
  const { t } = useTranslation('protocol_visualization')

  const [showPerStepOverflowMenu, setShowPerStepOverflowMenu] = useState(false)
  const handlePerStepOverflowClick = (): void => {
    setShowPerStepOverflowMenu(
      showPerStepOverflowMenu => !showPerStepOverflowMenu
    )
  }

  const handleTrackChange = (updatedTrack: {
    id: string
    value: number
  }): void => {
    const normalizedValue = updatedTrack.value / 100
    const nextIndex = Math.min(
      Math.max(Math.round(normalizedValue * (numCommandLength - 1)), 0),
      numCommandLength - 1
    )

    const nextCommandId = commands[nextIndex].id
    setSelectedCommand(nextCommandId)
  }

  const currentProgress =
    numCommandLength > 0
      ? (currentCommandIndex / (numCommandLength - 1)) * 100
      : 0

  const tracks = [
    {
      id: 'protocol-timeline',
      value: currentProgress,
    },
  ]

  // handlePlayPause by space key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === ' ') {
        event.preventDefault()
        handlePlayPause()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause])

  return (
    <div className={styles.container}>
      <div className={styles.controls_container}>
        <div className={styles.all_controls_info}>
          <div className={styles.controls_info}>
            <div className={styles.heading_text}>{protocolName}</div>
            <div className={styles.max_content_size}>
              {numErrors === 0 ? (
                <Chip type="success" chipSize="small" text={t('no_errors')} />
              ) : (
                <Chip type="error" text={t('errors', { count: numErrors })} />
              )}
            </div>
          </div>
          <div className={styles.buttons_container}>
            <div className={styles.per_step_button_wrapper}>
              <TertiaryButton
                buttonType="white"
                onClick={handlePerStepOverflowClick}
              >
                <StyledText desktopStyle="captionSemiBold" whiteSpace={NO_WRAP}>
                  {t('seconds_per_step', {
                    seconds: milliSecondsPerFrame / 1000,
                  })}
                </StyledText>
              </TertiaryButton>
              {showPerStepOverflowMenu ? (
                <PerStepOverflowMenu
                  setShowPerStepOverflowMenu={setShowPerStepOverflowMenu}
                  setMilliSecondsPerFrame={setMilliSecondsPerFrame}
                />
              ) : null}
            </div>
            <NewIconButton
              variant="primary"
              iconName={isPlaying ? 'pause' : 'play'}
              iconSize="1.5rem"
              iconColor={COLORS.white}
              size="3rem"
              onClick={handlePlayPause}
            />
          </div>
        </div>
      </div>
      <TimelineScrubber tracks={tracks} onTrackChange={handleTrackChange} />
    </div>
  )
}
