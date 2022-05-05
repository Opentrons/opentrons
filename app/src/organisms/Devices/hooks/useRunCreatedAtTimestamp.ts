import { useRunQuery } from '@opentrons/react-api-client'
import { formatTimestamp } from '../utils'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : '--:--:--'

  return createdAtTimestamp
}
