import { Reducer } from 'redux';
import { StepsState } from './steps/reducers';
import { Action } from '../types';
export interface RootState {
    steps: StepsState;
}
export declare const _uiSubReducers: {
    steps: Reducer<StepsState, Action>;
};
export declare const rootReducer: Reducer<RootState, Action>;
