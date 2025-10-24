import { useRunDataFileMetadata } from '@opentrons/react-api-client'

import { MIME_TYPES } from './constants'

// Returns the data file ids for all csv files generated as output during a run.
export function useOutputCsvDataFileIds(runId: string): string[] {
  const { data } = useRunDataFileMetadata(runId)

  return (
    data?.data
      .filter(data => data.mimeType === MIME_TYPES.CSV && data.generated)
      .map(data => data.id) ?? []
  )
}
