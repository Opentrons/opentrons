import sum from 'lodash/sum'

import { useNotifyImageFileQuery } from '/app/resources/dataFiles/useNotifyImageFileQuery'

import type { RunData } from '@opentrons/api-client'

// unchanging file counts
const NUM_PROTOCOL_FILES_PER_RUN = 1
const NUM_LABWARE_OFFSETS_FILES_PER_RUN = 1
const NUM_RUN_LOG_FILES_PER_RUN = 1

export function useRunFileCount(run: RunData): number {
  const { id: runId } = run

  // variable
  const numOutputFiles = 'outputFileIds' in run ? run.outputFileIds.length : 0
  const { data: imageData } = useNotifyImageFileQuery(runId)
  const numImageFiles = imageData?.data.length ?? 0
  const numRtpFiles =
    'runTimeParameters' in run
      ? run.runTimeParameters.filter(rtp => rtp.type === 'csv_file').length
      : 0

  return sum([
    NUM_PROTOCOL_FILES_PER_RUN,
    NUM_LABWARE_OFFSETS_FILES_PER_RUN,
    NUM_RUN_LOG_FILES_PER_RUN,
    numOutputFiles,
    numImageFiles,
    numRtpFiles,
  ])
}
