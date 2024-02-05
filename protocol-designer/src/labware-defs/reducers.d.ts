import { Reducer } from 'redux';
import { Action } from '../types';
import { LabwareUploadMessage, LabwareDefByDefURI } from './types';
export interface RootState {
    customDefs: LabwareDefByDefURI;
    labwareUploadMessage: LabwareUploadMessage | null | undefined;
}
export declare const rootReducer: Reducer<RootState, Action>;
