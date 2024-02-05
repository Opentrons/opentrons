import { PDProtocolFile } from '../file-types';
import { ThunkAction } from '../types';
import { FileUploadMessage, LoadFileAction, NewProtocolFields } from './types';
export interface FileUploadMessageAction {
    type: 'FILE_UPLOAD_MESSAGE';
    payload: FileUploadMessage;
}
export declare const fileUploadMessage: (payload: FileUploadMessage) => FileUploadMessageAction;
export interface DismissFileUploadMessageAction {
    type: 'DISMISS_FILE_UPLOAD_MESSAGE';
}
export declare const dismissFileUploadMessage: () => DismissFileUploadMessageAction;
export declare const loadFileAction: (payload: PDProtocolFile) => LoadFileAction;
export declare const loadProtocolFile: (event: React.SyntheticEvent<HTMLInputElement>) => ThunkAction<any>;
export interface UndoLoadFile {
    type: 'UNDO_LOAD_FILE';
}
export declare const undoLoadFile: () => UndoLoadFile;
export interface CreateNewProtocolAction {
    type: 'CREATE_NEW_PROTOCOL';
    payload: NewProtocolFields;
}
export declare const createNewProtocol: (payload: CreateNewProtocolAction['payload']) => CreateNewProtocolAction;
export interface SaveProtocolFileAction {
    type: 'SAVE_PROTOCOL_FILE';
}
export declare const saveProtocolFile: () => ThunkAction<SaveProtocolFileAction>;
