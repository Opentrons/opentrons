import { Flags } from './types';
export interface SetFeatureFlagAction {
    type: 'SET_FEATURE_FLAGS';
    payload: Partial<Flags>;
}
export declare const setFeatureFlags: (payload: Flags) => SetFeatureFlagAction;
