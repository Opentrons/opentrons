import { Reducer } from 'redux';
import { BaseState, Action } from '../../types';
import { Page } from '../types';
export declare const _allReducers: {
    page: Reducer<Page, any>;
    newProtocolModal: Reducer<boolean, any>;
};
export interface RootState {
    page: Page;
    newProtocolModal: boolean;
}
export declare const rootReducer: Reducer<RootState, Action>;
export declare const rootSelector: (state: BaseState) => RootState;
