import { DeckSlot, ThunkAction } from '../../types';
import { IngredInputs } from '../types';
export interface OpenAddLabwareModalAction {
    type: 'OPEN_ADD_LABWARE_MODAL';
    payload: {
        slot: DeckSlot;
    };
}
export declare const openAddLabwareModal: (payload: {
    slot: DeckSlot;
}) => OpenAddLabwareModalAction;
export interface CloseLabwareSelectorAction {
    type: 'CLOSE_LABWARE_SELECTOR';
}
export declare const closeLabwareSelector: () => CloseLabwareSelectorAction;
export interface OpenIngredientSelectorAction {
    type: 'OPEN_INGREDIENT_SELECTOR';
    payload: string;
}
export declare const openIngredientSelector: (payload: string) => OpenIngredientSelectorAction;
export interface CloseIngredientSelectorAction {
    type: 'CLOSE_INGREDIENT_SELECTOR';
}
export declare const closeIngredientSelector: () => CloseIngredientSelectorAction;
export interface DrillDownOnLabwareAction {
    type: 'DRILL_DOWN_ON_LABWARE';
    payload: string;
}
export declare const drillDownOnLabware: (payload: string) => DrillDownOnLabwareAction;
export interface DrillUpFromLabwareAction {
    type: 'DRILL_UP_FROM_LABWARE';
}
export declare const drillUpFromLabware: () => DrillUpFromLabwareAction;
export interface CreateContainerArgs {
    labwareDefURI: string;
    adapterUnderLabwareDefURI?: string;
    slot?: DeckSlot;
}
export interface CreateContainerAction {
    type: 'CREATE_CONTAINER';
    payload: CreateContainerArgs & {
        slot: DeckSlot;
        id: string;
    };
}
export interface DeleteContainerAction {
    type: 'DELETE_CONTAINER';
    payload: {
        labwareId: string;
    };
}
export declare const deleteContainer: (payload: {
    labwareId: string;
}) => DeleteContainerAction;
export interface SwapSlotContentsAction {
    type: 'MOVE_DECK_ITEM';
    payload: {
        sourceSlot: DeckSlot;
        destSlot: DeckSlot;
    };
}
export declare const moveDeckItem: (sourceSlot: DeckSlot, destSlot: DeckSlot) => SwapSlotContentsAction;
export interface DuplicateLabwareAction {
    type: 'DUPLICATE_LABWARE';
    payload: {
        templateLabwareId: string;
        duplicateLabwareId: string;
        duplicateLabwareNickname: string;
        slot: DeckSlot;
    };
}
export interface RemoveWellsContentsAction {
    type: 'REMOVE_WELLS_CONTENTS';
    payload: {
        labwareId: string;
        liquidGroupId?: string;
        wells: string[];
    };
}
export declare const removeWellsContents: (payload: RemoveWellsContentsAction['payload']) => RemoveWellsContentsAction;
export interface DeleteLiquidGroupAction {
    type: 'DELETE_LIQUID_GROUP';
    payload: string;
}
export declare const deleteLiquidGroup: (liquidGroupId: string) => ThunkAction<DeleteLiquidGroupAction>;
export interface SetWellContentsPayload {
    liquidGroupId: string;
    labwareId: string;
    wells: string[];
    volume: number;
}
export interface SetWellContentsAction {
    type: 'SET_WELL_CONTENTS';
    payload: SetWellContentsPayload;
}
export declare const setWellContents: (payload: SetWellContentsPayload) => SetWellContentsAction;
export interface SelectLiquidAction {
    type: 'SELECT_LIQUID_GROUP';
    payload: string;
}
export declare function selectLiquidGroup(liquidGroupId: string): SelectLiquidAction;
export interface DeselectLiquidGroupAction {
    type: 'DESELECT_LIQUID_GROUP';
}
export declare function deselectLiquidGroup(): DeselectLiquidGroupAction;
export interface CreateNewLiquidGroupAction {
    type: 'CREATE_NEW_LIQUID_GROUP_FORM';
}
export declare function createNewLiquidGroup(): CreateNewLiquidGroupAction;
export interface EditLiquidGroupAction {
    type: 'EDIT_LIQUID_GROUP';
    payload: IngredInputs & {
        liquidGroupId: string;
    };
}
export declare const editLiquidGroup: (args: IngredInputs & {
    liquidGroupId: string | null | undefined;
}) => ThunkAction<EditLiquidGroupAction>;
