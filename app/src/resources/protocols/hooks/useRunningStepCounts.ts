import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { useLastRunCommandNoFixit } from './useLastRunCommandNoFixit'

import type { CommandsData } from '@opentrons/api-client'

export interface StepCounts {
  /* Excludes "fixit" commands. Returns -1 if the step is not found. */
  currentStepNumber: number | null
  /* Returns null if the run is non-deterministic or the total command count is not found. */
  totalStepCount: number | null
  /* Returns whether the run is deterministic. */
  isDeterministicRun: boolean
}

/**
 * Find the index of the analysis command within the analysis
 * that has the same commandKey as the most recent
 * command from the run record.
 * In the case of a non-deterministic protocol,
 * source from the run rather than the analysis.
 * NOTE: The most recent
 * command may not always be "current", for instance if
 * the run has completed/failed.
 * NOTE #2: "Fixit" commands are excluded from the step count.
 * */
export function useRunningStepCounts(
  runId: string,
  commandsData: CommandsData | undefined
): StepCounts {
  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []
  const lastRunCommandNoFixit = useLastRunCommandNoFixit(
    runId,
    commandsData ?? null
  )

  const lastRunAnalysisCommandIndex = analysisCommands.findIndex(
    c => c.key === lastRunCommandNoFixit?.key
  )

  const currentStepNumberByAnalysis =
    lastRunAnalysisCommandIndex === -1 ? null : lastRunAnalysisCommandIndex + 1
  const currentStepNumberByRun = commandsData?.meta.totalLength ?? null

  const isDeterministicRun =
    lastRunCommandNoFixit?.key != null && currentStepNumberByAnalysis != null

  const currentStepNumber = isDeterministicRun
    ? currentStepNumberByAnalysis
    : currentStepNumberByRun

  const totalStepCount = isDeterministicRun ? analysisCommands.length : null

  return {
    currentStepNumber,
    totalStepCount,
    isDeterministicRun,
  }
}
