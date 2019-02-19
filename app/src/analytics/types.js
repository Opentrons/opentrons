// @flow

export type ProtocolAnalyticsData = {
  protocolType: string,
  protocolAppName: string,
  protocolAppVersion: string,
  protocolSource: string,
  protocolName: string,
  protocolAuthor: string,
  protocolText: string,
}

export type RobotAnalyticsData = {
  robotApiServerVersion: string,
  robotSmoothieVersion: string,
  robotLeftPipette: string,
  robotRightPipette: string,

  // feaure flags
  // e.g. robotFF_settingName
  [ffName: string]: boolean,
}

export type AnalyticsEvent = {|
  name: string,
  properties: {},
|}
