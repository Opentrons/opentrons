import type { Mixpanel } from '/ai-client/resources/types'

export const getHasOptedIn = (state: Mixpanel): boolean | null =>
  state.analytics.hasOptedIn
