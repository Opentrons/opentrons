import { useRunActionMutations } from '@opentrons/react-api-client'

import {
  DEFAULT_RUN_QUERY_REFETCH_INTERVAL,
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useCloneRun,
  useCurrentRunId,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
} from '/app/resources/runs'

import type { UseQueryOptions } from 'react-query'
import type { Run, RunData, RunStatus } from '@opentrons/api-client'

export interface RunControls {
  play: () => void
  pause: () => void
  stop: () => void
  reset: () => void
  resumeFromRecovery: () => void
  isPlayRunActionLoading: boolean
  isPauseRunActionLoading: boolean
  isStopRunActionLoading: boolean
  isResumeRunFromRecoveryActionLoading: boolean
  isResetRunLoading: boolean
  isRunControlLoading: boolean
}

export function useRunControls(
  runId: string | null,
  onCloneRunSuccess?: (createRunResponse: Run) => unknown
): RunControls {
  // TODO (jj): popup doc modal in desktop app
  const {
    playRun,
    pauseRun,
    stopRun,
    resumeRunFromRecovery,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResumeRunFromRecoveryActionLoading,
  } = useRunActionMutations(runId!, { reasonForInteractionRequired: false })

  const {
    cloneRun,
    isLoadingRun: isRunControlLoading,
    isCloning: isResetRunLoading,
  } = useCloneRun(runId ?? null, onCloneRunSuccess, true)

  return {
    play: playRun,
    pause: pauseRun,
    stop: stopRun,
    reset: cloneRun,
    resumeFromRecovery: resumeRunFromRecovery,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResumeRunFromRecoveryActionLoading,
    isRunControlLoading,
    isResetRunLoading,
  }
}

export function useCurrentRunStatus(
  options?: UseQueryOptions<Run>
): RunStatus | null {
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useNotifyRunQuery(currentRunId, {
    ...options,
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  return runRecord?.data.status ?? null
}

export function useRunErrors(runId: string | null): RunData['errors'] {
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_RUN_QUERY_REFETCH_INTERVAL,
  })

  return runRecord?.data?.errors ?? []
}

export function useProtocolHasRunTimeParameters(runId: string | null): boolean {
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const runTimeParameters = mostRecentAnalysis?.runTimeParameters ?? []
  return runTimeParameters.length > 0
}
