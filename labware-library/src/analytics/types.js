// @flow

export type AnalyticsEvent = {|
  name: string,
  properties?: Object,
|}

// this state is persisted in browser storage (via cookie).
// must be JSON-serializable.
export type AnalyticsState = {|
  trackingUUID: string,
  optedIn: boolean,
  seenOptIn: boolean,
|}
