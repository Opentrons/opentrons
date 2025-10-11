import { useTranslation } from 'react-i18next'

import {
  CommandText,
  getCommandTextData,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { RunTimer } from '/app/molecules/RunTimer'
import { useRunningStepCounts } from '/app/resources/protocols/hooks'
import { useNotifyAllCommandsQuery } from '/app/resources/runs'

import { PlayPauseButton } from '../shared/PlayPauseButton'
import { StopButton } from '../shared/StopButton'
import styles from './currentrunningcommand.module.css'

import type { RunCommandSummary, RunStatus } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface RunTimerInfo {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

export interface CurrentRunningProtocolCommandProps {
  runId: string
  runStatus: RunStatus | null
  robotSideAnalysis: CompletedProtocolAnalysis | null
  robotType: RobotType
  runTimerInfo: RunTimerInfo
  lastAnimatedCommand: string | null
  lastRunCommand: RunCommandSummary | null
  updateLastAnimatedCommand: (newCommandKey: string) => void
  allRunDefs: LabwareDefinition[]
  onStop: () => void
  onTogglePlayPause: () => void
  protocolName?: string
  currentRunCommandIndex?: number
}

export function CurrentRunningProtocolCommand({
  runId,
  runStatus,
  robotSideAnalysis,
  runTimerInfo,
  onTogglePlayPause,
  onStop,
  robotType,
  protocolName,
  currentRunCommandIndex,
  lastRunCommand,
  lastAnimatedCommand,
  updateLastAnimatedCommand,
  allRunDefs,
}: CurrentRunningProtocolCommandProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { data: mostRecentCommandData } = useNotifyAllCommandsQuery(runId, {
    pageLength: 1,
  })

  const currentCommand =
    robotSideAnalysis?.commands.find(
      (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
    ) ?? lastRunCommand

  let shouldAnimate = true
  if (currentCommand?.key != null) {
    if (lastAnimatedCommand == null) {
      updateLastAnimatedCommand(currentCommand.key)
      shouldAnimate = true
    } else if (lastAnimatedCommand === currentCommand.key) {
      shouldAnimate = false
    } else {
      shouldAnimate = true
      updateLastAnimatedCommand(currentCommand.key)
    }
  }
  const currentRunStatus = t(`status_${runStatus}`)

  const {
    currentStepNumber,
    totalStepCount,
    hasRunDiverged,
  } = useRunningStepCounts(runId, mostRecentCommandData)
  const stepCounterCopy = hasRunDiverged
    ? `${t('step_na')}`
    : `${t('step')} ${currentStepNumber ?? '?'}/${totalStepCount ?? '?'}`

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.status_info}>
          <LegacyStyledText className={styles.status_text}>
            {currentRunStatus}
          </LegacyStyledText>
          <LegacyStyledText className={styles.title_text}>
            {protocolName}
          </LegacyStyledText>
        </div>
        <div className={styles.timer_info}>
          <RunTimer {...runTimerInfo} style={styles.run_timer} />
          <LegacyStyledText
            style={{
              fontSize: TYPOGRAPHY.fontSize28,
              lineHeight: TYPOGRAPHY.lineHeight36,
              fontWeight: TYPOGRAPHY.fontWeightSemiBold,
            }}
          >
            {stepCounterCopy}
          </LegacyStyledText>
        </div>
      </div>

      <div className={styles.controls}>
        <StopButton onStop={onStop} />
        <PlayPauseButton
          onTogglePlayPause={onTogglePlayPause}
          runStatus={runStatus}
        />
      </div>

      <div
        className={`${styles.command_container} ${
          shouldAnimate ? styles.animated : styles.static
        }`}
      >
        {robotSideAnalysis != null && currentCommand != null ? (
          <CommandText
            command={currentCommand}
            commandTextData={getCommandTextData(robotSideAnalysis)}
            robotType={robotType}
            isOnDevice={true}
            allRunDefs={allRunDefs}
          />
        ) : null}
      </div>
    </div>
  )
}
