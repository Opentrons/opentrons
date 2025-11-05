import {
  ANALYTICS_CAMERA_ENABLEMENT_KIND,
  ANALYTICS_CAMERA_SETTINGS_KIND,
  ANALYTICS_IMAGE_CAPTURE_KIND,
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
  errorDetails?: string
}

interface MediaAccessParams {
  action: 'download' | 'downloadZip' | 'delete' | 'storageWarning' | 'liveFeed'
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
  reportLiveFeedUsage: (data: MediaAccessParams) => void
  /* Reports how often images are downloaded together, seperately, 
  how often images are deleted, and how often storage warnings appear. */
  reportPhotoAccessUsage: (data: MediaAccessParams) => void
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
    doTrackEvent({
      name: ANALYTICS_IMAGE_CAPTURE_KIND,
      properties: {
        robotType,
        source,
        transactionId: data.transactionId,
        amount: data.amount,
      },
    })
  }

  const reportLiveFeedUsage = (data: MediaAccessParams): void => {
    doTrackEvent({
      name: ANALYTICS_LIVE_FEED_KIND,
      properties: {
        source,
        robotType,
        transactionId: data.transactionId,
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
    reportPhotoAccessUsage,
  }
}
