import { useMemo } from 'react'

import { sortRunRecordOffsets } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
import { useNotifyRunQuery } from '/app/resources/runs'

import type { LabwareOffset } from '@opentrons/api-client'

export interface UseRunRecordLabwareOffsetsResult {
  /** Newest-first offsets from the run record. */
  offsets: LabwareOffset[]
  /** Run query has settled enough to trust `offsets`. */
  isReady: boolean
}

/**
 * Read-only view of labware offsets on the current run record. (clone/rerun)
 * Do not use for decisions before the run has started.
 */
export function useRunRecordLabwareOffsets(
  runId: string | null
): UseRunRecordLabwareOffsetsResult {
  const {
    data: runRecord,
    isFetched,
    isError,
  } = useNotifyRunQuery(runId, {
    staleTime: Infinity,
  })

  const offsets = useMemo(
    () =>
      sortRunRecordOffsets(
        Array.isArray(runRecord?.data.labwareOffsets)
          ? runRecord.data.labwareOffsets
          : []
      ),
    [runRecord?.data.labwareOffsets]
  )

  return {
    offsets,
    isReady: runRecord != null || isFetched || isError,
  }
}
