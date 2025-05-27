import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { updateLPCLabware } from '/app/redux/protocol-runs'

import type { LPCLabwareInfo } from '/app/redux/protocol-runs'

// Update the store with new labware when this app is *not* the app actively
// performing LPC.
export function useUpdateLabware(
  isFlex: boolean,
  runId: string | null,
  maintenanceRunId: string | null,
  labwareInfo: LPCLabwareInfo
): void {
  const dispatch = useDispatch()

  useEffect(() => {
    if (runId != null && maintenanceRunId == null && isFlex) {
      dispatch(updateLPCLabware(runId, labwareInfo.labware))
    }
  }, [labwareInfo, maintenanceRunId, isFlex])
}
