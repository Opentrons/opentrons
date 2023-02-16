import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  COLORS,
  BORDERS,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
  Icon,
  SIZE_1,
} from '@opentrons/components'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { StyledText } from '../../atoms/text'
import { CommandText } from '../CommandText'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ProgressBar } from '../../atoms/ProgressBar'
import { SecondaryButton } from '../../atoms/buttons'
import { useDownloadRunLog } from '../Devices/hooks'
import { useLastRunCommandKey } from '../Devices/hooks/useLastRunCommandKey'
import { InterventionTicks } from './InterventionTicks'

import type { RunStatus } from '@opentrons/api-client'

const TERMINAL_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
]

interface RunProgressMeterProps {
  runId: string
  robotName: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function RunProgressMeter(props: RunProgressMeterProps): JSX.Element {
  const { runId, robotName, makeHandleJumpToStep } = props
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus(runId)
  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []

  // todo (jb 2-16-23) This should be switched out soon for something more performant, see https://opentrons.atlassian.net/browse/RLAB-298
  const { downloadRunLog } = useDownloadRunLog(
    robotName,
    runId,
    analysisCommands.length
  )

  /**
   * find the analysis command within the analysis
   * that has the same commandKey as the most recent
   * command from the run record. NOTE: the most recent
   * command may not always be "current", for instance if
   * the run has completed/failed */
  const lastRunCommandKey = useLastRunCommandKey(runId)
  const lastRunCommandIndex =
    analysisCommands.findIndex(c => c.key === lastRunCommandKey) ?? 0
  let countOfTotalText = ''
  if (
    lastRunCommandIndex >= 0 &&
    lastRunCommandIndex <= analysisCommands.length - 1
  ) {
    countOfTotalText = ` ${lastRunCommandIndex + 1}/${analysisCommands.length}`
  } else if (analysis == null) {
    countOfTotalText = '?/?'
  }

  let currentStepContents: React.ReactNode = null
  if (analysis != null && analysisCommands[lastRunCommandIndex] != null) {
    currentStepContents = (
      <CommandText
        robotSideAnalysis={analysis}
        command={analysisCommands[lastRunCommandIndex]}
      />
    )
  } else if (
    runStatus === RUN_STATUS_IDLE &&
    analysisCommands[lastRunCommandIndex] == null
  ) {
    currentStepContents = (
      <StyledText as="h2">{t('not_started_yet')}</StyledText>
    )
  } else if (runStatus != null && TERMINAL_RUN_STATUSES.includes(runStatus)) {
    currentStepContents = (
      <StyledText as="h2">{t('protocol_completed')}</StyledText>
    )
  }

  const onDownloadClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }

  const downloadIsDisabled =
    runStatus != null && !TERMINAL_RUN_STATUSES.includes(runStatus)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex gridGap={SPACING.spacing3}>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{`${t(
            'current_step'
          )} ${countOfTotalText}${
            currentStepContents != null ? ': ' : ''
          }`}</StyledText>
          {currentStepContents}
        </Flex>
        <SecondaryButton
          disabled={downloadIsDisabled}
          color={COLORS.darkBlackEnabled}
          border={BORDERS.transparentLineBorder}
          cursor={downloadIsDisabled ? '' : 'pointer'}
          onClick={onDownloadClick}
        >
          <Flex gridGap={SPACING.spacing2}>
            <Icon name="download" size={SIZE_1} />
            <StyledText>{t('download_run_log_title_case')}</StyledText>
          </Flex>
        </SecondaryButton>
      </Flex>
      {analysis != null ? (
        <ProgressBar
          percentComplete={
            lastRunCommandIndex > 0
              ? ((lastRunCommandIndex + 1) / analysisCommands.length) * 100
              : 0
          }
          outerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.medGreyEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
            position: relative;
            overflow: initial;
          `}
          innerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.darkBlackEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
          `}
        >
          <InterventionTicks {...{ makeHandleJumpToStep, analysisCommands }} />
        </ProgressBar>
      ) : null}
    </Flex>
  )
}
