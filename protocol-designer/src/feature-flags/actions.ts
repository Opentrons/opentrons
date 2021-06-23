import { Flags } from './types'
export interface SetFeatureFlagAction {
  type: 'SET_FEATURE_FLAGS'
  payload: Partial<Flags>
}
export const setFeatureFlags = (payload: Flags): SetFeatureFlagAction => ({
  type: 'SET_FEATURE_FLAGS',
  payload,
})
