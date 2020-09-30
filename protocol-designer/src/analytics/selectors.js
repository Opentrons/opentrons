// @flow
import type { BaseState } from '../types'

export const getHasOptedIn = (state: BaseState): boolean | null =>
  state.analytics.hasOptedIn
