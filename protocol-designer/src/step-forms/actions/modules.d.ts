import { ModuleModel, ModuleType } from '@opentrons/shared-data';
import { DeckSlot } from '../../types';
export interface CreateModuleAction {
    type: 'CREATE_MODULE';
    payload: {
        slot: DeckSlot;
        type: ModuleType;
        model: ModuleModel;
        id: string;
    };
}
export declare const createModule: (args: Omit<CreateModuleAction['payload'], 'id'>) => CreateModuleAction;
export interface EditModuleAction {
    type: 'EDIT_MODULE';
    payload: {
        id: string;
        model: ModuleModel;
    };
}
export declare const editModule: (args: EditModuleAction['payload']) => EditModuleAction;
export interface DeleteModuleAction {
    type: 'DELETE_MODULE';
    payload: {
        id: string;
    };
}
export declare const deleteModule: (id: string) => DeleteModuleAction;
