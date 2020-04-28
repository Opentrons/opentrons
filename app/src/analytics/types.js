// @flow

import type { Config } from '../config/types'

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

export type AnalyticsEvent =
  | {|
      name: string,
      properties: { ... },
      superProperties?: { ... },
    |}
  | {| superProperties: { ... } |}

export type TrackEventArgs = [AnalyticsEvent, AnalyticsConfig]
