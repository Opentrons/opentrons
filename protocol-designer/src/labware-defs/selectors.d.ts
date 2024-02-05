import { BaseState, Selector } from '../types';
import { LabwareDefByDefURI, LabwareUploadMessage } from './types';
import { RootState } from './reducers';
import { RootState as StepFormRootState } from '../step-forms';
export declare const rootSelector: (state: BaseState) => RootState;
export declare const _getLabwareDefsByIdRootState: (arg0: StepFormRootState) => LabwareDefByDefURI;
export declare const getLabwareDefsByURI: Selector<LabwareDefByDefURI>;
export declare const getCustomLabwareDefsByURI: Selector<LabwareDefByDefURI>;
export declare const getLabwareUploadMessage: Selector<LabwareUploadMessage | null | undefined>;
