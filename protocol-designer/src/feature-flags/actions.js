// @flow
import type { Flags } from './types'

export type SetFeatureFlagAction = {|
  type: 'SET_FEATURE_FLAGS',
  payload: $Shape<Flags>,
|}

export const setFeatureFlags = (payload: Flags): SetFeatureFlagAction => ({
  type: 'SET_FEATURE_FLAGS',
  payload,
})
