import { formatTimestamp } from '/app/transformations/runs'
import { useNotifyRunQuery } from './useNotifyRunQuery'
import { EMPTY_TIMESTAMP } from './constants'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useNotifyRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : EMPTY_TIMESTAMP

  return createdAtTimestamp
}
