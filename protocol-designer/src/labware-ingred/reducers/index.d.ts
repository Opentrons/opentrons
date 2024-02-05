import { Reducer } from 'redux';
import { LabwareLiquidState } from '@opentrons/step-generation';
import { Action, DeckSlot } from '../../types';
import { LiquidGroupsById, DisplayLabware } from '../types';
export type SelectedContainerId = string | null | undefined;
export type DrillDownLabwareId = string | null | undefined;
export type ContainersState = Record<string, DisplayLabware | null | undefined>;
export interface SelectedLiquidGroupState {
    liquidGroupId: string | null | undefined;
    newLiquidGroup?: true;
}
export declare const containers: Reducer<ContainersState, any>;
type SavedLabwareState = Record<string, boolean>;
/** Keeps track of which labware have saved nicknames */
export declare const savedLabware: Reducer<SavedLabwareState, any>;
export type IngredientsState = LiquidGroupsById;
export declare const ingredients: Reducer<IngredientsState, any>;
type LocationsState = LabwareLiquidState;
export declare const ingredLocations: Reducer<LocationsState, any>;
export interface RootState {
    modeLabwareSelection: DeckSlot | false;
    selectedContainerId: SelectedContainerId;
    drillDownLabwareId: DrillDownLabwareId;
    containers: ContainersState;
    savedLabware: SavedLabwareState;
    selectedLiquidGroup: SelectedLiquidGroupState;
    ingredients: IngredientsState;
    ingredLocations: LocationsState;
}
export declare const rootReducer: Reducer<RootState, Action>;
export {};
