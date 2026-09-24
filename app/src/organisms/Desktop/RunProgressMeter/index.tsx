import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SecondaryButton,
  SIZE_1,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useCommandQuery } from '@opentrons/react-api-client'

import { getModalPortalEl } from '/app/App/portal'
import { ProgressBar } from '/app/atoms/ProgressBar'
import { isTerminalRunStatus } from '/app/local-resources/runs/utils'
import {
  InterventionModal,
  useInterventionModal,
} from '/app/organisms/InterventionModal'
import { useRunControls } from '/app/organisms/RunTimeControl'
import { useRobotType } from '/app/redux-resources/robots'
import { useRunningStepCounts } from '/app/resources/protocols/hooks'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useMostRecentCompletedAnalysis,
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { useDownloadRunLog } from '../Devices/hooks'
import { useRunProgressCopy } from './hooks'
import { InterventionTicks } from './InterventionTicks'

import type { MouseEventHandler, ReactNode } from 'react'

interface RunProgressMeterProps {
  runId: string
  robotName: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function RunProgressMeter(props: RunProgressMeterProps): ReactNode {
  const { runId, robotName, makeHandleJumpToStep } = props
  const { t } = useTranslation('run_details')
  const robotType = useRobotType(robotName)
  const { play } = useRunControls(runId)
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runData = runRecord?.data ?? null
  const runStatus = runData?.status ?? null

  const { data: mostRecentCommandData } = useNotifyAllCommandsQuery(runId, {
    pageLength: 1,
  })
  // This lastRunCommand also includes "fixit" commands.
  const lastRunCommand = mostRecentCommandData?.data[0] ?? null
  const { data: runCommandDetails } = useCommandQuery(
    runId,
    lastRunCommand?.id ?? null
  )

  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []

  const { currentStepNumber, totalStepCount, hasRunDiverged } =
    useRunningStepCounts(runId, mostRecentCommandData)

  const downloadEnabled = isTerminalRunStatus(runStatus)

  const { downloadRunLog } = useDownloadRunLog(robotName, runId)

  const onDownloadClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }
  const { showModal: showIntervention, modalProps: interventionProps } =
    useInterventionModal({
      robotName,
      runStatus,
      runData,
      analysis,
      lastRunCommand,
      doorIsOpen: runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
    })

  const { progressPercentage, stepCountStr, currentStepContents } =
    useRunProgressCopy({
      runId,
      runStatus,
      robotType,
      currentStepNumber,
      totalStepCount,
      analysis,
      analysisCommands,
      runCommandDetails: runCommandDetails ?? null,
      hasRunDiverged,
    })

  return (
    <>
      {showIntervention
        ? createPortal(
            <InterventionModal {...interventionProps} onResume={play} />,
            getModalPortalEl()
          )
        : null}
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex gridGap={SPACING.spacing8}>
            <StyledText
              color={COLORS.black90}
              desktopStyle={'bodyDefaultSemiBold'}
            >
              {stepCountStr}
            </StyledText>
            {currentStepContents}
          </Flex>
          {downloadEnabled ? (
            <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
              <SecondaryButton border-width={1} onClick={onDownloadClick}>
                <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
                  <Icon name="download" size={SIZE_1} />
                  {t('download_run_log')}
                </Flex>
              </SecondaryButton>
            </Flex>
          ) : null}
        </Flex>
        {!hasRunDiverged ? (
          <ProgressBar
            percentComplete={progressPercentage}
            outerStyles={css`
              height: 0.375rem;
              background-color: ${COLORS.grey30};
              border-radius: ${BORDERS.borderRadius4};
              position: relative;
              overflow: initial;
            `}
            innerStyles={css`
              height: 0.375rem;
              background-color: ${COLORS.grey60};
              border-radius: ${BORDERS.borderRadius4};
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
