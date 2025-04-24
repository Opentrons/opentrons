import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { appliedOffsetsToRun } from '/app/redux/protocol-runs'
import {
  useClientDataLPC,
  useUpdateClientLPC,
} from '/app/resources/client_data/'
import { useIsRunCurrent } from '/app/resources/runs'

const CLIENT_DATA_INTERVAL_MS = 5000

// Keep the applied offset state in sync between various apps using the same robot.
export function useHandleClientAppliedOffsets(
  isFlex: boolean,
  thisRunId: string | null
): void {
  const dispatch = useDispatch()
  const isThisRunCurrent = useIsRunCurrent(thisRunId)

  const { clearClientData } = useUpdateClientLPC()
  const { runId: clientDataRunId, userId: clientDataUserId } = useClientDataLPC(
    {
      refetchInterval: CLIENT_DATA_INTERVAL_MS,
      enabled: isFlex,
    }
  )

  useEffect(() => {
    if (isFlex) {
      if (isThisRunCurrent) {
        if (clientDataRunId !== thisRunId && clientDataRunId != null) {
          clearClientData()
        }
        // Offsets applied by another user but not locally - mark as applied locally
        else if (
          clientDataUserId != null &&
          clientDataRunId === thisRunId &&
          thisRunId != null
        ) {
          dispatch(appliedOffsetsToRun(thisRunId))
        }
      } else {
        if (clientDataRunId === thisRunId) {
          clearClientData()
        }
      }
    }
  }, [isThisRunCurrent, clientDataRunId, clientDataUserId, thisRunId, isFlex])
}
