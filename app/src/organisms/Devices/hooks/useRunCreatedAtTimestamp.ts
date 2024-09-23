import { formatTimestamp } from '../utils'
import { useNotifyRunQuery, EMPTY_TIMESTAMP } from '/app/resources/runs'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useNotifyRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : EMPTY_TIMESTAMP

  return createdAtTimestamp
}
