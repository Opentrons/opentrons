import { useRunQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

import type { Run } from '@opentrons/api-client'

const REFETCH_INTERVAL = 1000

export function useCurrentRun(): Run | null {
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })

  return runRecord ?? null
}
