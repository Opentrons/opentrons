import { Reducer } from 'redux';
import { Action } from '../types';
type OptInState = boolean | null;
export interface RootState {
    hasOptedIn: OptInState;
}
export declare const rootReducer: Reducer<RootState, Action>;
export {};
