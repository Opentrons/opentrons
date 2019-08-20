// @flow
import type { DropdownOption } from '@opentrons/components'
import type { State } from '../types'
import type { Config, UpdateChannel } from './types'

export const getConfig = (state: State): Config => state.config

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
  return getConfig(state).devtools
    ? UPDATE_CHANNEL_OPTS_WITH_ALPHA
    : UPDATE_CHANNEL_OPTS
}
