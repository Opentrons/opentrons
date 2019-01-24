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

export type AnalyticsEvent = {|
  name: string,
  properties: {},
|}
