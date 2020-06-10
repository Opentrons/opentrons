// @flow
import type { DropdownOption } from '@opentrons/components'
import type { State } from '../types'
import type { Config, FeatureFlags, UpdateChannel } from './types'

export const getConfig = (state: State): Config | null => state.config

export const getDevtoolsEnabled = (state: State): boolean => {
  return state.config?.devtools ?? false
}

export const getFeatureFlags = (state: State): FeatureFlags => {
  return state.config?.devInternal ?? {}
}

export const getUpdateChannel = (state: State): UpdateChannel => {
  return state.config?.update.channel ?? 'latest'
}

const UPDATE_CHANNEL_OPTS = [
  { name: 'Stable', value: (('latest': UpdateChannel): string) },
  { name: 'Beta', value: (('beta': UpdateChannel): string) },
]

const UPDATE_CHANNEL_OPTS_WITH_ALPHA = [
  ...UPDATE_CHANNEL_OPTS,
  { name: 'Alpha', value: (('alpha': UpdateChannel): string) },
]

export const getUpdateChannelOptions = (
  state: State
): Array<DropdownOption> => {
  return state.config?.devtools || state.config?.update.channel === 'alpha'
    ? UPDATE_CHANNEL_OPTS_WITH_ALPHA
    : UPDATE_CHANNEL_OPTS
}
