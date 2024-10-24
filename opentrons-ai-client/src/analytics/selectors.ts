import type { Mixpanel } from '../resources/types'

export const getHasOptedIn = (state: Mixpanel): boolean | null =>
  state.analytics.hasOptedIn
