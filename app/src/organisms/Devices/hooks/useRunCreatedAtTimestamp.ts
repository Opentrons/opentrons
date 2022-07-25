import { useRunQuery } from '@opentrons/react-api-client'
import { formatTimestamp } from '../utils'
import { EMPTY_TIMESTAMP } from '../constants'

export function useRunCreatedAtTimestamp(runId: string | null): string {
  const runRecord = useRunQuery(runId)

  const createdAtTimestamp =
    runRecord?.data?.data.createdAt != null
      ? formatTimestamp(runRecord?.data?.data.createdAt)
      : EMPTY_TIMESTAMP

  return createdAtTimestamp
}
