import { Reducer } from 'redux';
import { BaseState, Action } from '../types';
import { StepIdType } from '../form-types';
export type WarningType = string;
export type DismissedWarningsAllSteps = Record<StepIdType, WarningType[] | null | undefined>;
export interface DismissedWarningState {
    form: DismissedWarningsAllSteps;
    timeline: DismissedWarningsAllSteps;
}
export declare const _allReducers: {
    dismissedWarnings: Reducer<DismissedWarningState, any>;
};
export interface RootState {
    dismissedWarnings: DismissedWarningState;
}
export declare const rootReducer: Reducer<RootState, Action>;
export declare const rootSelector: (state: BaseState) => RootState;
