import {
  ANALYTICS_CAMERA_ENABLEMENT_KIND,
  ANALYTICS_CAMERA_SETTINGS_KIND,
  ANALYTICS_IMAGE_CAPTURE_KIND,
  ANALYTICS_LIVE_FEED_KIND,
  ANALYTICS_PHOTO_ACCESS,
  useTrackEvent,
} from '/app/redux/analytics'

import type { RobotType } from '@opentrons/shared-data'

export interface cameraAnalyticsParams {
  source: 'protocolRunRecord' | 'robotSettings' | 'ODD'
  runId?: string
  robotType?: RobotType
  session?: string
}

export type CameraAnalyticKind = 'protocolCommand' | 'liveCommand'

interface cameraUsageParams extends cameraAnalyticsParams {
  cameraEnabled: boolean
  liveFeedEnabled: boolean
  recoveryCaptureEnabled: boolean
}
interface cameraSettingsParams extends cameraAnalyticsParams {
  settingsType: 'zoom' | 'saturation' | 'brightness' | 'contrast'
  value: number | string
}

interface captureParams extends cameraAnalyticsParams {
  amount: number
  errorDetails?: string
}

interface photoAccessParams extends cameraAnalyticsParams {
  amount: number
  action: 'download' | 'downloadZip' | 'delete' | 'storageWarning'
}

export interface UseCameraUsageAnalyticsResult {
  /* Reports when camera enablement settings change. */
  reportCameraEnablementSettings: (data: cameraUsageParams) => void
  /* Reports when camera view settings change. */
  reportCameraSettings: (data: cameraSettingsParams) => void
  /* Reports image capture rate and sources. */
  reportImageCaptureUsage: (data: captureParams) => void
  /* Reports live feed usage. */
  reportLiveFeedUsage: (data: captureParams) => void
  /* Reports how often images are downloaded together, seperately, 
  how often images are deleted, and how often storage warnings appear. */
  reportPhotoAccessUsage: (data: photoAccessParams) => void
}

export function useCameraAnalytics({
  runId,
  robotType,
}: cameraAnalyticsParams): UseCameraUsageAnalyticsResult {
  const doTrackEvent = useTrackEvent()

  const reportCameraEnablementSettings = (data: cameraUsageParams): void => {
    const cameraEnablementToggleId = `camera-enablement-toggle-${runId}-${Date.now()}`
    console.log(
      `rc logging camera enablement ${cameraEnablementToggleId} ${data.cameraEnabled} ${data.source}`
    )
    doTrackEvent({
      name: ANALYTICS_CAMERA_ENABLEMENT_KIND,
      properties: {
        robotType,
        source: data.source,
        session: cameraEnablementToggleId,
        cameraEnabled: data.cameraEnabled,
        liveFeedEnabled: data.liveFeedEnabled,
        recoveryCaptureEnabled: data.recoveryCaptureEnabled,
      },
    })
  }
  const reportCameraSettings = (data: cameraSettingsParams): void => {
    const cameraSettingsToggleId = `camera-settings-toggle-${runId}-${Date.now()}`
    console.log(`rc logging camera settings ${cameraSettingsToggleId}`)
    doTrackEvent({
      name: ANALYTICS_CAMERA_SETTINGS_KIND,
      properties: {
        robotType,
        source: data.source,
        session: cameraSettingsToggleId,
        value: data.value,
        settingsType: data.settingsType,
      },
    })
  }

  const reportImageCaptureUsage = (data: captureParams): void => {
    const imageCaptureId = `image-capture-${runId}-${Date.now()}`
    console.log(`rc logging image capture ${imageCaptureId} ${data.amount}`)
    doTrackEvent({
      name: ANALYTICS_IMAGE_CAPTURE_KIND,
      properties: {
        robotType,
        source: data.source,
        errorDetails: data.errorDetails,
        session: imageCaptureId,
      },
    })
  }

  const reportLiveFeedUsage = (data: captureParams): void => {
    const liveFeedId = `live-feed-${runId}-${Date.now()}`
    console.log(`rc logging live feed usage ${liveFeedId}`)
    doTrackEvent({
      name: ANALYTICS_LIVE_FEED_KIND,
      properties: {
        errorDetails: data.errorDetails,
        session: liveFeedId,
      },
    })
  }

  const reportPhotoAccessUsage = (data: photoAccessParams): void => {
    const photoAccessId = `photo-access-${runId}-${Date.now()}`
    console.log(`rc logging camera access ${photoAccessId} ${data.action}`)
    doTrackEvent({
      name: ANALYTICS_PHOTO_ACCESS,
      properties: {
        robotType,
        source: data.source,
        amount: data.amount,
        action: data.action,
        session: photoAccessId,
      },
    })
  }
  return {
    reportCameraEnablementSettings,
    reportCameraSettings,
    reportImageCaptureUsage,
    reportLiveFeedUsage,
    reportPhotoAccessUsage,
  }
}
