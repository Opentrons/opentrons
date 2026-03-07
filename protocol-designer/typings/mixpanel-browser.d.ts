declare module 'mixpanel-browser' {
  export interface Config {
    opt_out_tracking_by_default?: boolean
    disable_persistence?: boolean
    track_pageview?: boolean
  }

  export interface Mixpanel {
    init(token: string, config?: Partial<Config>): void
    register(properties: Record<string, unknown>): void
    track(eventName: string, properties?: Record<string, unknown>): void
    identify(distinctId: string): void
    opt_in_tracking(): void
    opt_out_tracking(): void
    reset(): void
  }

  const mixpanel: Mixpanel
  export default mixpanel
}
