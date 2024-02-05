import { Selector } from 'reselect';
import { Options } from '@opentrons/components';
import { LabwareLiquidState } from '@opentrons/step-generation';
import { RootState, ContainersState, DrillDownLabwareId, IngredientsState, SelectedContainerId, SelectedLiquidGroupState } from './reducers';
import { AllIngredGroupFields, OrderedLiquids } from './types';
import { BaseState, DeckSlot } from './../types';
interface RootSlice {
    labwareIngred: RootState;
}
export declare const selectors: {
    rootSelector: (state: RootSlice) => RootState;
    getLiquidGroupsById: (state: RootSlice) => IngredientsState;
    getLiquidsByLabwareId: (state: RootSlice) => LabwareLiquidState;
    getLiquidNamesById: Selector<RootSlice, Record<string, string>>;
    getLabwareSelectionMode: Selector<RootSlice, boolean>;
    getLabwareNameInfo: Selector<RootSlice, ContainersState>;
    getLiquidSelectionOptions: Selector<RootSlice, Options>;
    getLiquidGroupsOnDeck: Selector<RootSlice, string[]>;
    getNextLiquidGroupId: Selector<RootSlice, string>;
    getSavedLabware: (state: BaseState) => Record<string, boolean>;
    getSelectedLabwareId: Selector<RootSlice, SelectedContainerId>;
    getSelectedLiquidGroupState: Selector<RootSlice, SelectedLiquidGroupState>;
    getDrillDownLabwareId: Selector<RootSlice, DrillDownLabwareId>;
    allIngredientGroupFields: Selector<RootSlice, AllIngredGroupFields>;
    allIngredientNamesIds: Selector<RootSlice, OrderedLiquids>;
    selectedAddLabwareSlot: (state: BaseState) => DeckSlot | false;
    getDeckHasLiquid: Selector<RootSlice, boolean>;
    getLiquidDisplayColors: Selector<RootSlice, string[]>;
};
export {};
