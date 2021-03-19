// @flow

import type { Config } from '../config/types'

import typeof {
  INTERCOM_EVENT_CALCHECK_COMPLETE,
  INTERCOM_EVENT_NO_CAL_BLOCK,
} from './constants'

import type { CalibrationHealthCheckAnalyticsData } from '../analytics/types'

export type IntercomEventName =
  | INTERCOM_EVENT_CALCHECK_COMPLETE
  | INTERCOM_EVENT_NO_CAL_BLOCK

export type SupportConfig = $PropertyType<Config, 'support'>

export type BasicIntercomPayload = $Shape<{|
  [propertyName: string]: string | number | boolean | null,
|}>

export type IntercomPayload =
  | BasicIntercomPayload
  | CalibrationHealthCheckAnalyticsData

export type SupportProfileUpdate = $Shape<{|
  [propertyName: string]: string | number | boolean | null,
|}>

export type IntercomEvent = {|
  eventName: IntercomEventName,
  metadata?: IntercomPayload,
|}
