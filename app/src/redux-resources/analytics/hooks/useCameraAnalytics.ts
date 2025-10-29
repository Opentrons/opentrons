import {
  ANALYTICS_CAMERA_SETTINGS_KIND,
  ANALYTICS_IMAGE_CAPTURE_KIND,
  ANALYTICS_LIVE_FEED_KIND,
  ANALYTICS_PHOTO_ACCESS,
  useTrackEvent,
} from '/app/redux/analytics'

import type { RobotType } from '@opentrons/shared-data'

export interface cameraAnalyticsParams {
  runId?: string
  robotType?: RobotType
  source?: string
  session?: string
}

export type CameraAnalyticKind = 'protocolCommand' | 'liveCommand'

interface cameraUsageParams extends cameraAnalyticsParams {
  enabled: boolean
  enablementType: 'camera' | 'liveFeed' | 'recoveryCapture'
}

interface captureParams extends cameraAnalyticsParams {
  amount: number
  errorDetails?: string
}

interface photoAccessParams extends cameraAnalyticsParams {
  amount: number
  action: 'download' | 'delete' | 'storageWarning'
}

export interface UseCameraUsageAnalyticsResult {
  /* Reports when camera enablement settings change. */
  reportCameraEnablementSettings: (data: cameraUsageParams) => void
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
    const cameraSettingToggleId = `camera-settings-toggle-${runId}-${Date.now()}`
    doTrackEvent({
      name: ANALYTICS_CAMERA_SETTINGS_KIND,
      properties: {
        robotType,
        source: data.source,
        session: cameraSettingToggleId,
        enabled: data.enabled,
        enablementType: data.enablementType,
      },
    })
  }

  const reportImageCaptureUsage = (data: captureParams): void => {
    const imageCaptureId = `image-capture-${runId}-${Date.now()}`
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
    reportImageCaptureUsage,
    reportLiveFeedUsage,
    reportPhotoAccessUsage,
  }
}
