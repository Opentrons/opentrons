// @flow

import type { Config } from '../config'

export type AnalyticsConfig = $PropertyType<Config, 'analytics'>

export type ProtocolAnalyticsData = {|
  protocolType: string,
  protocolAppName: string,
  protocolAppVersion: string,
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

  // feaure flags
  // e.g. robotFF_settingName
  [ffName: string]: boolean,
|}

export type BuildrootAnalyticsData = {|
  currentVersion: string,
  currentSystem: string,
  updateVersion: string,
  error: string | null,
|}

export type AnalyticsEvent = {|
  name: string,
  properties: {},
|}

export type TrackEventArgs = [AnalyticsEvent, AnalyticsConfig]
