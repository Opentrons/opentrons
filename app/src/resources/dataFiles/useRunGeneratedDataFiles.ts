import { useRunDataFileMetadata } from '@opentrons/react-api-client'

import { MIME_TYPES } from './constants'

export interface RunGeneratedDataFileIdsByType {
  csv: string[]
  jpeg: string[]
}

const DEFAULT_DATA_FILES_BY_TYPE: RunGeneratedDataFileIdsByType = {
  csv: [],
  jpeg: [],
}

// Returns lists of data file ids for each run-generated data file mime type.
export function useRunGeneratedDataFiles(
  runId: string
): RunGeneratedDataFileIdsByType {
  const { data } = useRunDataFileMetadata(runId)

  return (
    data?.data.reduce<RunGeneratedDataFileIdsByType>((acc, data) => {
      switch (data.mimeType) {
        case MIME_TYPES.CSV:
          return {
            ...acc,
            csv: [...acc.csv, data.id],
          }
        case MIME_TYPES.IMAGE:
          return {
            ...acc,
            jpeg: [...acc.jpeg, data.id],
          }
      }
    }, DEFAULT_DATA_FILES_BY_TYPE) ?? DEFAULT_DATA_FILES_BY_TYPE
  )
}
