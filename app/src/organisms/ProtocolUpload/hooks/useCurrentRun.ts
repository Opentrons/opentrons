import { useCurrentRunId } from './useCurrentRunId'
import { useNotifyRunQuery } from '../../../resources/runs/useNotifyRunQuery'

import type { Run } from '@opentrons/api-client'

const REFETCH_INTERVAL = 5000

// TODO: doesn't have to fetch after status is terminal
export function useCurrentRun(): Run | null {
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useNotifyRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })

  return runRecord ?? null
}
