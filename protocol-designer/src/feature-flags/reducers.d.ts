import { Reducer } from 'redux';
import { Flags, FlagTypes } from './types';
import { Action } from '../types';
export declare const _allReducers: {
    flags: Reducer<Partial<Record<FlagTypes, boolean | null | undefined>>, any>;
};
export interface RootState {
    flags: Flags;
}
export declare const rootReducer: Reducer<RootState, Action>;
