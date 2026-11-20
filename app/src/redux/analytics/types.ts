import type { RobotType } from '@opentrons/shared-data'
import type { Config } from '../config/types'
import type { ANALYTICS_RESOURCE_MONITOR_REPORT } from './constants'

export type AnalyticsConfig = Config['analytics']

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
  robotSerialNumber: string
}

export interface RobotAnalyticsData {
  robotApiServerVersion: string
  robotSmoothieVersion: string
  robotSerialNumber: string

  // feature flags
  // e.g. robotFF_settingName
  [ffName: string]: boolean | string
}

export interface BuildrootAnalyticsData {
  currentVersion: string
  currentSystem: string
  updateVersion: string
  error: string | null
  robotSerialNumber: string | null
  robotType: RobotType | undefined
}

export type AnalyticsEvent =
  | {
      name: string
      properties: { [key: string]: unknown }
      superProperties?: { [key: string]: unknown }
    }
  | { superProperties: { [key: string]: unknown } }

export type TrackEventArgs = [AnalyticsEvent | null, AnalyticsConfig | null]

export interface ResourceMonitorAnalyticsAction {
  type: typeof ANALYTICS_RESOURCE_MONITOR_REPORT
  payload: {
    systemAvailMemMb: string
    systemUptimeHrs: string
    processesDetails: Array<Record<string, any>>
  }
}

export type AnalyticsTriggerAction = ResourceMonitorAnalyticsAction
