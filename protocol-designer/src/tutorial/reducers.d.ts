import { Reducer } from 'redux';
import { Action } from '../types';
import type { HintKey } from './index';
type HintReducerState = HintKey[];
type DismissedHintReducerState = Record<HintKey, {
    rememberDismissal: boolean;
}>;
export declare const dismissedHintsPersist: (state: DismissedHintReducerState) => Partial<DismissedHintReducerState>;
export interface RootState {
    hints: HintReducerState;
    dismissedHints: DismissedHintReducerState;
}
export declare const rootReducer: Reducer<RootState, Action>;
export {};
