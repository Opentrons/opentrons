import {
  ANALYTICS_CAMERA_ENABLEMENT_KIND,
  ANALYTICS_CAMERA_SETTINGS_KIND,
  ANALYTICS_IMAGE_CAPTURE_KIND,
  ANALYTICS_LIVE_FEED_KIND,
  ANALYTICS_PHOTO_ACCESS,
  useTrackEvent,
} from '/app/redux/analytics'

import type { RobotType } from '@opentrons/shared-data'
import type {
  SOURCE_ROBOT_SETTINGS,
  SOURCE_RUN_RECORD,
} from '/app/redux/analytics'

export interface CameraAnalyticsParams {
  source: typeof SOURCE_RUN_RECORD | typeof SOURCE_ROBOT_SETTINGS
  robotType?: RobotType
}

export interface CameraAnalyticsRunRecord extends CameraAnalyticsParams {
  source: typeof SOURCE_RUN_RECORD
  runId: string
  cameraEnabled: boolean
  liveFeedEnabled: boolean
  recoveryCaptureEnabled: boolean
}

export interface CameraAnalyticsRobotSettings extends CameraAnalyticsParams {
  source: typeof SOURCE_ROBOT_SETTINGS
  transactionId: string
  cameraEnabled: boolean
  liveFeedEnabled: boolean
  recoveryCaptureEnabled: boolean
}

export type CameraUsageParams =
  | CameraAnalyticsRunRecord
  | CameraAnalyticsRobotSettings

interface CameraSettingsParams extends CameraAnalyticsParams {
  settingsType: 'zoom' | 'saturation' | 'brightness' | 'contrast'
  value: number | string
}

interface CaptureParams extends CameraAnalyticsParams {
  amount: number
  runId: string
  errorDetails?: string
}

interface PhotoAccessProtocolRun extends CameraAnalyticsParams {
  runId: string
  action: 'download' | 'downloadZip' | 'delete' | 'storageWarning'
}

interface PhotoAccessRobotSettings extends CameraAnalyticsParams {
  transactionId: string
  action: 'download' | 'downloadZip' | 'delete' | 'storageWarning'
}

export type PhotoAccessParams =
  | PhotoAccessRobotSettings
  | PhotoAccessProtocolRun

const isPhotoAccessProtocolRun = (
  data: PhotoAccessParams
): data is PhotoAccessProtocolRun => {
  return true
}

const isCameraEnablementProtocolRun = (
  data: CameraUsageParams
): data is CameraAnalyticsRunRecord => {
  return true
}

export interface UseCameraUsageAnalyticsResult {
  /* Reports when camera enablement settings change. */
  reportCameraEnablementSettings: (data: CameraUsageParams) => void
  /* Reports when camera view settings change. */
  reportCameraSettings: (data: CameraSettingsParams) => void
  /* Reports image capture rate and sources. */
  reportImageCaptureUsage: (data: CaptureParams) => void
  /* Reports live feed usage. */
  reportLiveFeedUsage: (data: CaptureParams) => void
  /* Reports how often images are downloaded together, seperately, 
  how often images are deleted, and how often storage warnings appear. */
  reportPhotoAccessUsage: (data: PhotoAccessParams) => void
}

export function useCameraAnalytics({
  robotType,
}: CameraAnalyticsParams): UseCameraUsageAnalyticsResult {
  const doTrackEvent = useTrackEvent()

  const reportCameraEnablementSettings = (data: CameraUsageParams): void => {
    if (isCameraEnablementProtocolRun(data)) {
      doTrackEvent({
        name: ANALYTICS_CAMERA_ENABLEMENT_KIND,
        properties: {
          robotType,
          source: data.source,
          runId: data.runId,
          cameraEnabled: data.cameraEnabled,
          liveFeedEnabled: data.liveFeedEnabled,
          recoveryCaptureEnabled: data.recoveryCaptureEnabled,
        },
      })
    } else {
      doTrackEvent({
        name: ANALYTICS_CAMERA_ENABLEMENT_KIND,
        properties: {
          robotType,
          source: data.source,
          transactionId: data.transactionId,
          cameraEnabled: data.cameraEnabled,
          liveFeedEnabled: data.liveFeedEnabled,
          recoveryCaptureEnabled: data.recoveryCaptureEnabled,
        },
      })
    }
  }
  const reportCameraSettings = (data: CameraSettingsParams): void => {
    doTrackEvent({
      name: ANALYTICS_CAMERA_SETTINGS_KIND,
      properties: {
        robotType,
        source: data.source,
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
        source: data.source,
        errorDetails: data.errorDetails,
      },
    })
  }

  const reportLiveFeedUsage = (data: CaptureParams): void => {
    doTrackEvent({
      name: ANALYTICS_LIVE_FEED_KIND,
      properties: {
        errorDetails: data.errorDetails,
      },
    })
  }

  const reportPhotoAccessUsage = (data: PhotoAccessParams): void => {
    if (isPhotoAccessProtocolRun(data)) {
      doTrackEvent({
        name: ANALYTICS_PHOTO_ACCESS,
        properties: {
          robotType,
          source: data.source,
          runId: data.runId,
          action: data.action,
        },
      })
    } else {
      doTrackEvent({
        name: ANALYTICS_PHOTO_ACCESS,
        properties: {
          robotType,
          source: data.source,
          transactionId: data.transactionId,
          action: data.action,
        },
      })
    }
  }
  return {
    reportCameraEnablementSettings,
    reportCameraSettings,
    reportImageCaptureUsage,
    reportLiveFeedUsage,
    reportPhotoAccessUsage,
  }
}
