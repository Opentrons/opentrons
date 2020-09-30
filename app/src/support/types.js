// @flow

import type { Config } from '../config/types'

import typeof { INTERCOM_EVENT_CALCHECK_COMPLETE } from './constants'

export type IntercomEventName = INTERCOM_EVENT_CALCHECK_COMPLETE

export type SupportConfig = $PropertyType<Config, 'support'>

export type IntercomPayload = $Shape<{|
  [propertyName: string]: string | number | boolean | null,
|}>

export type SupportProfileUpdate = $Shape<{|
  [propertyName: string]: string | number | boolean | null,
|}>

export type IntercomEvent = {|
  eventName: IntercomEventName,
  metadata?: IntercomPayload,
|}
