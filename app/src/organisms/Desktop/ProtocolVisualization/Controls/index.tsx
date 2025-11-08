import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Chip,
  COLORS,
  NewIconButton,
  NO_WRAP,
  StyledText,
  TertiaryButton,
  TimelineScrubber,
} from '@opentrons/components'

import { stepDetailViewerUpdateAction } from '/app/redux/shell'

import styles from './controls.module.css'
import { PerStepOverflowMenu } from './PerStepOverflowMenu'

// import {
//   getNextGroupFirstCommandId,
//   getPreviousGroupFirstCommandId,
// } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  Liquid,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
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
  spotlightWindowData: {
    protocolKey: string
    robotState: RobotState
    invariantContext: InvariantContext
    analysis: ProtocolAnalysisOutput
    liquids: Liquid[]
    slot: string | null
    command?: RunTimeCommand
  }
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
    // groupedCommands,
    spotlightWindowData,
    milliSecondsPerFrame,
    setMilliSecondsPerFrame,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const dispatch = useDispatch()

  const [showPerStepOverflowMenu, setShowPerStepOverflowMenu] = useState(false)
  // ToDo (kk: 2025-10-03) the following will be used when TimelineScrubber is added to this component
  // const currentCommandId = commands[currentCommandIndex].id
  // const nextGroupFirstCommandId = getNextGroupFirstCommandId(
  //   groupedCommands,
  //   currentCommandId
  // )
  // const previousGroupFirstCommandId = getPreviousGroupFirstCommandId(
  //   groupedCommands,
  //   currentCommandId
  // )

  // const handleBack = (): void => {
  //   if (previousGroupFirstCommandId != null) {
  //     setSelectedCommand(previousGroupFirstCommandId)
  //   } else {
  //     setSelectedCommand(commands[0].id)
  //   }
  // }
  // const handleForward = (): void => {
  //   if (nextGroupFirstCommandId != null) {
  //     setSelectedCommand(nextGroupFirstCommandId)
  //   } else {
  //     setSelectedCommand(commands[commands.length - 1].id)
  //   }
  // }

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

    setSelectedCommand(commands[nextIndex].id)

    if (
      spotlightWindowData.slot != null &&
      spotlightWindowData.command != null
    ) {
      dispatch(
        stepDetailViewerUpdateAction({
          protocolKey: spotlightWindowData.protocolKey,
          slot: spotlightWindowData.slot,
          command: spotlightWindowData.command,
          robotState: spotlightWindowData.robotState,
          invariantContext: spotlightWindowData.invariantContext,
          analysis: spotlightWindowData.analysis,
          liquids: spotlightWindowData.liquids,
        })
      )
    }
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

  return (
    <>
      <div className={styles.container}>
        <div className={styles.controls_container}>
          <div className={styles.all_controls_info}>
            <div className={styles.controls_info}>
              <div className={styles.heading_text}>{protocolName}</div>
              <div className={styles.max_content_size}>
                {numErrors === 0 ? (
                  <Chip type="success" chipSize="small" text="No errors" />
                ) : (
                  <Chip type="error" text={`${numErrors} error`} />
                )}
              </div>
            </div>
            <div className={styles.buttons}>
              <div className={styles.per_step_button_wrapper}>
                <TertiaryButton
                  buttonType="white"
                  onClick={handlePerStepOverflowClick}
                >
                  <StyledText
                    desktopStyle="captionSemiBold"
                    whiteSpace={NO_WRAP}
                  >
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
    </>
  )
}
