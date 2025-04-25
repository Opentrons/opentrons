import { formatTimestamp } from '/app/transformations/runs'

import { EMPTY_TIMESTAMP } from './constants'
import { useNotifyRunQuery } from './useNotifyRunQuery'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useNotifyRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : EMPTY_TIMESTAMP

  return createdAtTimestamp
}
