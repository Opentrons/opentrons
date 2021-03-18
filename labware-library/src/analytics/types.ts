export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

// this state is persisted in browser storage (via cookie).
// must be JSON-serializable.
export interface AnalyticsState {
  optedIn: boolean
  seenOptIn: boolean
}
