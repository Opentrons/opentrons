import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  CommandText,
  getCommandTextData,
  getLabwareDefinitionsFromCommands,
} from '@opentrons/components'

import {
  isRunStatusNotStarted,
  isTerminalRunStatus,
} from '/app/local-resources/runs/utils'
import { useModuleCommandAnalytics } from '/app/redux-resources/analytics/'

import type { ReactNode } from 'react'
import type { CommandDetail, RunStatus } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface UseRunProgressResult {
  currentStepContents: ReactNode
  stepCountStr: string | null
  progressPercentage: number
}

interface UseRunProgressProps {
  runId: string | null
  runStatus: RunStatus | null
  currentStepNumber: number | null
  totalStepCount: number | null
  analysis: CompletedProtocolAnalysis | null
  hasRunDiverged: boolean
  runCommandDetails: CommandDetail | null
  robotType: RobotType
  analysisCommands: RunTimeCommand[]
}

// TODO(jh, 08-05-24): Testing is sufficiently covered by RunProgressMeter, but we should migrate relevant tests to this
// hook after devising a better way to test i18n outside of a component.
export function useRunProgressCopy({
  runId,
  runStatus,
  currentStepNumber,
  totalStepCount,
  hasRunDiverged,
  runCommandDetails,
  analysisCommands,
  robotType,
  analysis,
}: UseRunProgressProps): UseRunProgressResult {
  const { t } = useTranslation('run_details')

  const runHasNotBeenStarted =
    currentStepNumber === 0 && isRunStatusNotStarted(runStatus)

  const isValidRobotSideAnalysis = analysis != null
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValidRobotSideAnalysis]
  )

  const currentStepContents = ((): JSX.Element | null => {
    if (isTerminalRunStatus(runStatus) || runHasNotBeenStarted) {
      return null
    } else if (analysis != null && !hasRunDiverged) {
      return (
        <CommandText
          commandTextData={getCommandTextData(analysis)}
          command={analysisCommands[currentStepNumber! - 1]}
          robotType={robotType}
          allRunDefs={allRunDefs}
        />
      )
    } else if (
      analysis != null &&
      hasRunDiverged &&
      runCommandDetails != null
    ) {
      return (
        <CommandText
          commandTextData={getCommandTextData(analysis)}
          command={runCommandDetails.data}
          robotType={robotType}
          allRunDefs={allRunDefs}
        />
      )
    } else {
      return null
    }
  })()

  const progressPercentage = runHasNotBeenStarted
    ? 0
    : (currentStepNumber! / analysisCommands.length) * 100

  const stepCountStr = ((): string | null => {
    if (isTerminalRunStatus(runStatus) || runStatus === RUN_STATUS_IDLE) {
      return null
    }
    if (currentStepNumber == null) {
      return `${t(`current_step`)}: ${t('na')}`
    } else if (hasRunDiverged) {
      return `${t(`current_step`)} ${t('na')}:`
    } else {
      const getCountString = (): string => {
        const current = currentStepNumber ?? '?'
        const total = totalStepCount ?? '?'
        return `${current}/${total}`
      }

      return `${t(`current_step`)} ${getCountString()}:`
    }
  })()
  const { reportModuleCommand } = useModuleCommandAnalytics()

  reportModuleCommand({
    kind: 'protocolCommand',
    analyticCommand: runCommandDetails?.data?.commandType ?? '',
    result: {
      status: runCommandDetails?.data?.status ?? undefined,
      data: runCommandDetails?.data?.result,
    },
    errorDetails: runCommandDetails?.data?.error?.errorType ?? '',
    params: runCommandDetails?.data?.params ?? undefined,
    analysis,
    runId,
  })

  return {
    currentStepContents,
    stepCountStr,
    progressPercentage,
  }
}
