/// <reference types="react" />
import type { ThunkAction } from '../types';
import type { LabwareUploadMessage } from './types';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
export interface LabwareUploadMessageAction {
    type: 'LABWARE_UPLOAD_MESSAGE';
    payload: LabwareUploadMessage;
}
export declare const labwareUploadMessage: (payload: LabwareUploadMessage) => LabwareUploadMessageAction;
export interface CreateCustomLabwareDef {
    type: 'CREATE_CUSTOM_LABWARE_DEF';
    payload: {
        def: LabwareDefinition2;
    };
}
export declare const createCustomLabwareDefAction: (payload: CreateCustomLabwareDef['payload']) => CreateCustomLabwareDef;
export interface ReplaceCustomLabwareDef {
    type: 'REPLACE_CUSTOM_LABWARE_DEF';
    payload: {
        defURIToOverwrite: string;
        newDef: LabwareDefinition2;
        isOverwriteMismatched: boolean;
    };
}
export declare const replaceCustomLabwareDef: (payload: ReplaceCustomLabwareDef['payload']) => ReplaceCustomLabwareDef;
export declare const createCustomLabwareDef: (event: React.SyntheticEvent<HTMLInputElement>) => ThunkAction<any>;
export declare const createCustomTiprackDef: (event: React.SyntheticEvent<HTMLInputElement>) => ThunkAction<any>;
interface DismissLabwareUploadMessage {
    type: 'DISMISS_LABWARE_UPLOAD_MESSAGE';
}
export declare const dismissLabwareUploadMessage: () => DismissLabwareUploadMessage;
export {};
