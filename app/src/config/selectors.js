// @flow
import type { DropdownOption } from '@opentrons/components'
import type { State, Config } from '../types'
import type { FeatureFlags, UpdateChannel } from './types'
export const getConfig = (state: State): Config => state.config

export const getFeatureFlags = (state: State): FeatureFlags =>
  getConfig(state).devInternal || {}

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
  const config = getConfig(state)
  return config.devtools || config.update.channel === 'alpha'
    ? UPDATE_CHANNEL_OPTS_WITH_ALPHA
    : UPDATE_CHANNEL_OPTS
}
