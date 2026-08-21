import sum from 'lodash/sum'

import { useRunDataFileMetadata } from '@opentrons/react-api-client'

import type { RunData } from '@opentrons/api-client'

// unchanging file counts
const NUM_PROTOCOL_FILES_PER_RUN = 1
const NUM_LABWARE_OFFSETS_FILES_PER_RUN = 1
const NUM_RUN_LOG_FILES_PER_RUN = 1

export function useRunFileCount(run: RunData): number {
  const { id: runId } = run

  // variable
  const { data: runDataFilesData } = useRunDataFileMetadata(runId)
  const numOutputDataFiles = (runDataFilesData?.data ?? []).length

  const numRtpFiles =
    'runTimeParameters' in run
      ? run.runTimeParameters.filter(rtp => rtp.type === 'csv_file').length
      : 0

  return sum([
    NUM_PROTOCOL_FILES_PER_RUN,
    NUM_LABWARE_OFFSETS_FILES_PER_RUN,
    NUM_RUN_LOG_FILES_PER_RUN,
    numOutputDataFiles,
    numRtpFiles,
  ])
}
