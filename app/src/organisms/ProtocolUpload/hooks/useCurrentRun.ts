import { useCurrentRunId } from './useCurrentRunId'
import type { Run } from '@opentrons/api-client'
import { useRunQuery } from '@opentrons/react-api-client'

const REFETCH_INTERVAL = 5000

// TODO: doesn't have to fetch after status is terminal
export function useCurrentRun(): Run | null {
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })

  return runRecord ?? null
}
