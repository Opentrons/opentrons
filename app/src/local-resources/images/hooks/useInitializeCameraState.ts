import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { updateCameraUsageSettings } from '/app/redux/protocol-runs'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyRunQuery } from '/app/resources/runs'

// Populate the toggles with the run settings if they have been set,
//  otherwise, populate the toggles with the camera settings once the network
//  request completes.
export function useInitializeCameraState(runId: string): void {
  const { data: cameraSettings } = useNotifyCamera({ staleTime: Infinity })
  const { data } = useNotifyRunQuery(runId)
  const dispatch = useDispatch()
  const runCameraSettings = data?.data.cameraSettings
  const cameraSettingsExist = cameraSettings != null
  const runCameraSettingsExist = runCameraSettings != null

  useEffect(
    () => {
      if (runCameraSettings != null) {
        const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
          runCameraSettings

        dispatch(
          updateCameraUsageSettings({
            runId,
            cameraEnabled,
            liveStreamEnabled,
            recoveryEnabled: errorRecoveryCameraEnabled,
          })
        )
      } else if (cameraSettings != null) {
        const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
          cameraSettings

        dispatch(
          updateCameraUsageSettings({
            runId,
            cameraEnabled,
            liveStreamEnabled,
            recoveryEnabled: errorRecoveryCameraEnabled,
          })
        )
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cameraSettingsExist, runCameraSettingsExist]
  )
}
