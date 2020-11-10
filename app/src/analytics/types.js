// @flow

import type { Config } from '../config/types'
import typeof {
  ANALYTICS_PIPETTE_OFFSET_STARTED,
  ANALYTICS_TIP_LENGTH_STARTED,
} from './constants'
import * as CalUITypes from '../components/CalibrationPanels/types'
import type { DeckCalibrationStatus } from '../calibration/types'

export type AnalyticsConfig = $PropertyType<Config, 'analytics'>

export type ProtocolAnalyticsData = {|
  protocolType: string,
  protocolAppName: string,
  protocolAppVersion: string,
  protocolApiVersion: string,
  protocolSource: string,
  protocolName: string,
  protocolAuthor: string,
  protocolText: string,
  pipettes: string,
  modules: string,
|}

export type RobotAnalyticsData = {|
  robotApiServerVersion: string,
  robotSmoothieVersion: string,
  robotLeftPipette: string,
  robotRightPipette: string,

  // feature flags
  // e.g. robotFF_settingName
  [ffName: string]: boolean,
|}

export type BuildrootAnalyticsData = {|
  currentVersion: string,
  currentSystem: string,
  updateVersion: string,
  error: string | null,
|}

export type PipetteOffsetCalibrationAnalyticsData = {|
  calibrationExists: boolean,
  markedBad: boolean | null,
  pipetteModel: string,
|}

export type TipLengthCalibrationAnalyticsData = {|
  calibrationExists: boolean,
  markedBad: boolean | null,
  pipetteModel: string,
|}

export type ModelsByMount = {|
  left: { model: string },
  right: { model: string },
|}

export type DeckCalibrationAnalyticsData = {|
  calibrationStatus: DeckCalibrationStatus | null,
  markedBad: boolean | null,
  pipettes: ModelsByMount,
|}

export type CalibrationHealthCheckAnalyticsData = {|
  pipettes: ModelsByMount,
|}

export type AnalyticsSessionExitDetails = {|
  sessionType: string,
  step: string,
|}

export type AnalyticsEvent =
  | {|
      name: string,
      properties: { ... },
      superProperties?: { ... },
    |}
  | {| superProperties: { ... } |}

export type TrackEventArgs = [AnalyticsEvent | null, AnalyticsConfig | null]

export type PipetteOffsetStartedAnalyticsAction = {|
  type: ANALYTICS_PIPETTE_OFFSET_STARTED,
  payload: {|
    intent: CalUITypes.PipetteOffsetIntent,
    mount: string,
    calBlock: boolean,
    shouldPerformTipLength: boolean,
    tipRackURI: string | null,
  |},
|}

export type TipLengthStartedAnalyticsAction = {|
  type: ANALYTICS_TIP_LENGTH_STARTED,
  payload: {|
    intent: CalUITypes.PipetteOffsetIntent,
    mount: string,
    calBlock: boolean,
    tipRackURI: string,
  |},
|}

export type AnalyticsTriggerAction =
  | PipetteOffsetStartedAnalyticsAction
  | TipLengthStartedAnalyticsAction
