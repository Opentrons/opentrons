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
  Link,
  ALIGN_CENTER,
  useHoverTooltip,
  TOOLTIP_LEFT,
} from '@opentrons/components'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import {
  useAllCommandsQuery,
  useCommandQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { Tooltip } from '../../atoms/Tooltip'
import { CommandText } from '../CommandText'
import { useRunStatus } from '../RunTimeControl/hooks'
import { InterventionModal } from '../InterventionModal'
import { ProgressBar } from '../../atoms/ProgressBar'
import { useDownloadRunLog } from '../Devices/hooks'
import { InterventionTicks } from './InterventionTicks'
import { isInterventionCommand } from '../InterventionModal/utils'

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
  resumeRunHandler: () => void
}
export function RunProgressMeter(props: RunProgressMeterProps): JSX.Element {
  const { runId, robotName, makeHandleJumpToStep, resumeRunHandler } = props
  const [
    interventionModalCommandKey,
    setInterventionModalCommandKey,
  ] = React.useState<string | null>(null)
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus(runId)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const { data: runRecord } = useRunQuery(runId)
  const runData = runRecord?.data ?? null
  const analysis = useMostRecentCompletedAnalysis(runId)
  const { data: allCommandsQueryData } = useAllCommandsQuery(runId, {
    cursor: null,
    pageLength: 1,
  })
  const analysisCommands = analysis?.commands ?? []
  const lastRunCommand = allCommandsQueryData?.data[0] ?? null
  const runCommandsLength = allCommandsQueryData?.meta.totalLength

  const downloadIsDisabled =
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_IDLE ||
    runStatus === RUN_STATUS_FINISHING

  const { downloadRunLog } = useDownloadRunLog(robotName, runId)

  /**
   * find the index of the analysis command within the analysis
   * that has the same commandKey as the most recent
   * command from the run record.
   * Or in the case of a non-deterministic protocol
   * source from the run rather than the analysis
   * NOTE: the most recent
   * command may not always be "current", for instance if
   * the run has completed/failed */
  const lastRunAnalysisCommandIndex =
    analysisCommands.findIndex(c => c.key === lastRunCommand?.key) ?? 0
  const { data: runCommandDetails } = useCommandQuery(
    runId,
    lastRunCommand?.key ?? null
  )
  let countOfTotalText = ''
  if (
    lastRunAnalysisCommandIndex >= 0 &&
    lastRunAnalysisCommandIndex <= analysisCommands.length - 1
  ) {
    countOfTotalText = ` ${lastRunAnalysisCommandIndex + 1}/${
      analysisCommands.length
    }`
  } else if (
    lastRunAnalysisCommandIndex === -1 &&
    lastRunCommand?.key != null &&
    runCommandsLength != null
  ) {
    countOfTotalText = `${runCommandsLength}/?`
  } else if (analysis == null) {
    countOfTotalText = ''
  }

  const runHasNotBeenStarted =
    (lastRunAnalysisCommandIndex === 0 &&
      runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR) ||
    runStatus === RUN_STATUS_IDLE

  let currentStepContents: React.ReactNode = null
  if (runHasNotBeenStarted) {
    currentStepContents = (
      <StyledText as="h2">{t('not_started_yet')}</StyledText>
    )
  } else if (
    analysis != null &&
    analysisCommands[lastRunAnalysisCommandIndex] != null
  ) {
    currentStepContents = (
      <CommandText
        robotSideAnalysis={analysis}
        command={analysisCommands[lastRunAnalysisCommandIndex]}
      />
    )
  } else if (
    analysis != null &&
    lastRunAnalysisCommandIndex === -1 &&
    runCommandDetails != null
  ) {
    currentStepContents = (
      <CommandText
        robotSideAnalysis={analysis}
        command={runCommandDetails.data}
      />
    )
  } else if (runStatus != null && TERMINAL_RUN_STATUSES.includes(runStatus)) {
    currentStepContents = (
      <StyledText as="h2">{t('protocol_completed')}</StyledText>
    )
  }

  React.useEffect(() => {
    if (
      lastRunCommand != null &&
      interventionModalCommandKey != null &&
      lastRunCommand.key !== interventionModalCommandKey
    ) {
      // set intervention modal command key to null if different from current command key
      setInterventionModalCommandKey(null)
    } else if (
      lastRunCommand?.key != null &&
      isInterventionCommand(lastRunCommand) &&
      interventionModalCommandKey === null
    ) {
      setInterventionModalCommandKey(lastRunCommand.key)
    }
  }, [lastRunCommand, interventionModalCommandKey])

  const onDownloadClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    if (downloadIsDisabled) return false
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }

  return (
    <>
      {interventionModalCommandKey != null &&
      lastRunCommand != null &&
      isInterventionCommand(lastRunCommand) &&
      analysisCommands != null &&
      runStatus != null &&
      runData != null &&
      !TERMINAL_RUN_STATUSES.includes(runStatus) ? (
        <Portal level="top">
          <InterventionModal
            robotName={robotName}
            command={lastRunCommand}
            onResume={resumeRunHandler}
            run={runData}
            analysis={analysis}
          />
        </Portal>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex gridGap={SPACING.spacing8}>
            <StyledText
              as="h2"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >{`${t('current_step')}${
              runStatus === RUN_STATUS_IDLE
                ? ':'
                : ` ${countOfTotalText}${
                    currentStepContents != null ? ': ' : ''
                  }`
            }`}</StyledText>

            {currentStepContents}
          </Flex>
          <Link
            {...targetProps}
            role="button"
            css={css`
            ${TYPOGRAPHY.darkLinkH4SemiBold}
            &:hover {
              color: ${
                downloadIsDisabled
                  ? COLORS.darkGreyEnabled
                  : COLORS.darkBlackEnabled
              };
            }
            cursor: ${downloadIsDisabled ? 'default' : 'pointer'};
          }
          `}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={onDownloadClick}
          >
            <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
              <Icon name="download" size={SIZE_1} />
              {t('download_run_log')}
            </Flex>
          </Link>
          {downloadIsDisabled ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t('complete_protocol_to_download')}
            </Tooltip>
          ) : null}
        </Flex>
        {analysis != null && lastRunAnalysisCommandIndex >= 0 ? (
          <ProgressBar
            percentComplete={
              runHasNotBeenStarted
                ? 0
                : ((lastRunAnalysisCommandIndex + 1) /
                    analysisCommands.length) *
                  100
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
              background-color: ${COLORS.darkGreyEnabled};
              border-radius: ${BORDERS.radiusSoftCorners};
            `}
          >
            <InterventionTicks
              {...{ makeHandleJumpToStep, analysisCommands }}
            />
          </ProgressBar>
        ) : null}
      </Flex>
    </>
  )
}
