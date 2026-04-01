import {
  ANALYTICS_CAMERA_ENABLEMENT_KIND,
  ANALYTICS_CAMERA_SETTINGS_KIND,
  ANALYTICS_IMAGE_CAPTURE_KIND,
  ANALYTICS_LIVE_FEED_DURATION,
  ANALYTICS_LIVE_FEED_KIND,
  ANALYTICS_PHOTO_ACCESS,
  useTrackEvent,
} from '/app/redux/analytics'

import type { RobotType } from '@opentrons/shared-data'

export const SOURCE_RUN_RECORD = 'runRecord' as const
export const SOURCE_ROBOT_SETTINGS = 'robotSettings' as const

export interface CameraAnalyticsParams {
  source: typeof SOURCE_RUN_RECORD | typeof SOURCE_ROBOT_SETTINGS
  robotType: RobotType
}

export interface CameraUsageParams {
  cameraEnabled: boolean
  liveFeedEnabled: boolean
  recoveryCaptureEnabled: boolean
}

interface CameraSettingsParams {
  settingsType: 'zoom' | 'saturation' | 'brightness' | 'contrast'
  value: number | string
}

interface CaptureParams {
  amount: number
  transactionId: string
}

interface LiveFeedParams {
  runId: string
}
interface LiveFeedDurationParams extends LiveFeedParams {
  durationSeconds: number
}
interface MediaAccessParams {
  action: 'download' | 'downloadZip' | 'delete' | 'storageWarning'
  transactionId?: string
}

export interface UseCameraUsageAnalyticsResult {
  /* Reports when camera enablement settings change. */
  reportCameraEnablementSettings: (data: CameraUsageParams) => void
  /* Reports when camera view settings change. */
  reportCameraSettings: (data: CameraSettingsParams) => void
  /* Reports image capture rate and sources. */
  reportImageCaptureUsage: (data: CaptureParams) => void
  /* Reports live feed usage. */
  reportLiveFeedUsage: (data: LiveFeedParams) => void
  /* Reports how often images are downloaded together, seperately, 
  how often images are deleted, and how often storage warnings appear. */
  reportPhotoAccessUsage: (data: MediaAccessParams) => void
  /* Reports the duration that the livestream was viewed for a particular session. */
  reportLiveFeedDuration: (data: LiveFeedDurationParams) => void
}

export function useCameraAnalytics({
  robotType,
  source,
}: CameraAnalyticsParams): UseCameraUsageAnalyticsResult {
  const doTrackEvent = useTrackEvent()

  const reportCameraEnablementSettings = (data: CameraUsageParams): void => {
    doTrackEvent({
      name: ANALYTICS_CAMERA_ENABLEMENT_KIND,
      properties: {
        robotType,
        source,
        cameraEnabled: data.cameraEnabled,
        liveFeedEnabled: data.liveFeedEnabled,
        recoveryCaptureEnabled: data.recoveryCaptureEnabled,
      },
    })
  }
  const reportCameraSettings = (data: CameraSettingsParams): void => {
    doTrackEvent({
      name: ANALYTICS_CAMERA_SETTINGS_KIND,
      properties: {
        robotType,
        source,
        value: data.value,
        settingsType: data.settingsType,
      },
    })
  }

  const reportImageCaptureUsage = (data: CaptureParams): void => {
    if (data.amount > 0) {
      doTrackEvent({
        name: ANALYTICS_IMAGE_CAPTURE_KIND,
        properties: {
          robotType,
          transactionId: data.transactionId,
          amount: data.amount,
        },
      })
    }
  }

  const reportLiveFeedUsage = (data: LiveFeedParams): void => {
    doTrackEvent({
      name: ANALYTICS_LIVE_FEED_KIND,
      properties: {
        robotType,
        runId: data.runId,
      },
    })
  }

  const reportLiveFeedDuration = (data: LiveFeedDurationParams): void => {
    doTrackEvent({
      name: ANALYTICS_LIVE_FEED_DURATION,
      properties: {
        runId: data.runId,
        duration: `${data.durationSeconds} seconds`,
      },
    })
  }

  const reportPhotoAccessUsage = (data: MediaAccessParams): void => {
    const baseProperties = {
      robotType,
      source,
      action: data.action,
    }
    const finalProperties =
      data.action === 'storageWarning'
        ? { ...baseProperties, transactionId: data.transactionId }
        : baseProperties
    doTrackEvent({
      name: ANALYTICS_PHOTO_ACCESS,
      properties: finalProperties,
    })
  }
  return {
    reportCameraEnablementSettings,
    reportCameraSettings,
    reportImageCaptureUsage,
    reportLiveFeedUsage,
    reportLiveFeedDuration,
    reportPhotoAccessUsage,
  }
}
