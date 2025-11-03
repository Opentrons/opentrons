import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { useCamera } from '@opentrons/react-api-client'

import {
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraStreamEnablement,
} from '/app/redux/protocol-runs'
import { useNotifyRunQuery } from '/app/resources/runs'

// Populate the toggles with the run settings if they have been set,
//  otherwise, populate the toggles with the camera settings once the network
//  request completes.
export function useInitializeCameraState(runId: string): void {
  const { data: cameraSettings } = useCamera()
  const { data } = useNotifyRunQuery(runId)
  const dispatch = useDispatch()
  const runCameraSettings = data?.data.cameraSettings
  const cameraSettingsExist = cameraSettings != null
  const runCameraSettingsExist = runCameraSettings != null

  useEffect(() => {
    if (runCameraSettings != null) {
      const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
        runCameraSettings

      dispatch(updateCameraEnablement(runId, cameraEnabled))
      dispatch(updateCameraStreamEnablement(runId, liveStreamEnabled))
      dispatch(
        updateCameraRecoveryEnablement(runId, errorRecoveryCameraEnabled)
      )
    } else if (cameraSettings != null) {
      const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
        cameraSettings

      dispatch(updateCameraEnablement(runId, cameraEnabled))
      dispatch(updateCameraStreamEnablement(runId, liveStreamEnabled))
      dispatch(
        updateCameraRecoveryEnablement(runId, errorRecoveryCameraEnabled)
      )
    }
  }, [cameraSettingsExist, runCameraSettingsExist])
}
