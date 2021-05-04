import type { Config } from '../config/types'

import {
  INTERCOM_EVENT_CALCHECK_COMPLETE,
  INTERCOM_EVENT_NO_CAL_BLOCK,
} from './constants'

import type { CalibrationHealthCheckAnalyticsData } from '../analytics/types'

export type IntercomEventName =
  | typeof INTERCOM_EVENT_CALCHECK_COMPLETE
  | typeof INTERCOM_EVENT_NO_CAL_BLOCK

export type SupportConfig = Config['support']

export type BasicIntercomPayload = Partial<{
  [propertyName: string]: string | number | boolean | null
}>

export type IntercomPayload =
  | BasicIntercomPayload
  | CalibrationHealthCheckAnalyticsData

export type SupportProfileUpdate = Partial<{
  [propertyName: string]: string | number | boolean | null
}>

export interface IntercomEvent {
  eventName: IntercomEventName
  metadata?: IntercomPayload
}
