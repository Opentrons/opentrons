import { Reducer } from 'redux';
import { WellGroup } from '@opentrons/components';
import { Action } from '../types';
interface SelectedWellsState {
    highlighted: WellGroup;
    selected: WellGroup;
}
export interface RootState {
    selectedWells: SelectedWellsState;
}
export declare const rootReducer: Reducer<RootState, Action>;
export {};
