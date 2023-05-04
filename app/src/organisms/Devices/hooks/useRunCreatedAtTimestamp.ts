import { EMPTY_TIMESTAMP } from '../constants'
import { formatTimestamp } from '../utils'
import { useRunQuery } from '@opentrons/react-api-client'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : EMPTY_TIMESTAMP

  return createdAtTimestamp
}
