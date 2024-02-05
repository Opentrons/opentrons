import { Reducer } from 'redux';
import { Action } from '../types';
import { FileUploadMessage } from './types';
type FileUploadMessageState = FileUploadMessage | null | undefined;
export declare const _allReducers: {
    fileUploadMessage: Reducer<FileUploadMessageState, any>;
    unsavedChanges: (state: boolean | undefined, action: {
        type: string;
        payload: any;
    }) => boolean;
};
export interface RootState {
    fileUploadMessage: FileUploadMessageState;
    unsavedChanges: boolean;
}
export declare const rootReducer: Reducer<RootState, Action>;
export {};
