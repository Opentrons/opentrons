import { BaseState, Selector } from '../types';
import { RootState } from './reducers';
export declare const rootSelector: (state: BaseState) => RootState;
export declare const getFileUploadMessages: Selector<RootState['fileUploadMessage']>;
export declare const getHasUnsavedChanges: Selector<RootState['unsavedChanges']>;
