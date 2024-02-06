import {
  ANALYTICS_PIPETTE_OFFSET_STARTED,
  ANALYTICS_TIP_LENGTH_STARTED,
} from './constants'

import type { CalibrationCheckComparisonsPerCalibration } from '../sessions/types'
import type { DeckCalibrationStatus } from '../calibration/types'
import type { Mount } from '@opentrons/components'
import type { ConfigV0 } from '../config/types'

export type AnalyticsConfig = ConfigV0['analytics']

export interface ProtocolAnalyticsData {
  protocolType: string
  protocolAppName: string
  protocolAppVersion: string
  protocolApiVersion: string
  protocolSource: string
  protocolName: string
  protocolAuthor: string
  protocolText: string
  pipettes: string
  modules: string
}

export type RobotAnalyticsData = {
  robotApiServerVersion: string
  robotSmoothieVersion: string
  robotLeftPipette: string
  robotRightPipette: string
  robotSerialNumber: string
} & {
  // feature flags
  // e.g. robotFF_settingName
  [ffName: string]: boolean
}

export interface BuildrootAnalyticsData {
  currentVersion: string
  currentSystem: string
  updateVersion: string
  error: string | null
}

export interface PipetteOffsetCalibrationAnalyticsData {
  calibrationExists: boolean
  markedBad: boolean | null
  pipetteModel: string
}

export interface TipLengthCalibrationAnalyticsData {
  calibrationExists: boolean
  markedBad: boolean | null
  pipetteModel: string
}

export type ModelsByMount = {
  [mount in Mount]: { model: string } | null
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DeckCalibrationAnalyticsData = {
  calibrationStatus: DeckCalibrationStatus | null
  markedBad: boolean | null
  pipettes: ModelsByMount
}

export interface CalibrationCheckByMount {
  left: {
    model: string
    comparisons: CalibrationCheckComparisonsPerCalibration
    succeeded: boolean
  } | null
  right: {
    model: string
    comparisons: CalibrationCheckComparisonsPerCalibration
    succeeded: boolean
  } | null
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CalibrationHealthCheckAnalyticsData = {
  pipettes: CalibrationCheckByMount | null
}

export interface AnalyticsSessionExitDetails {
  sessionType: string
  step: string
}

export type AnalyticsEvent =
  | {
      name: string
      properties: { [key: string]: unknown }
      superProperties?: { [key: string]: unknown }
    }
  | { superProperties: { [key: string]: unknown } }

export type TrackEventArgs = [AnalyticsEvent | null, AnalyticsConfig | null]

export interface PipetteOffsetStartedAnalyticsAction {
  type: typeof ANALYTICS_PIPETTE_OFFSET_STARTED
  payload: {
    mount: string
    calBlock: boolean
    shouldPerformTipLength: boolean
    tipRackURI: string | null
  }
}

export interface TipLengthStartedAnalyticsAction {
  type: typeof ANALYTICS_TIP_LENGTH_STARTED
  payload: {
    mount: string
    calBlock: boolean
    tipRackURI: string
  }
}

export type AnalyticsTriggerAction =
  | PipetteOffsetStartedAnalyticsAction
  | TipLengthStartedAnalyticsAction

export interface SessionInstrumentAnalyticsData {
  sessionType: string
  pipetteModel: string
}
