import { CreateContainerArgs, CreateContainerAction, DuplicateLabwareAction } from './actions';
import { ThunkAction } from '../../types';
export interface RenameLabwareAction {
    type: 'RENAME_LABWARE';
    payload: {
        labwareId: string;
        name?: string | null;
    };
}
export declare const renameLabware: (args: RenameLabwareAction['payload']) => ThunkAction<CreateContainerAction | RenameLabwareAction>;
export declare const createContainer: (args: CreateContainerArgs) => ThunkAction<CreateContainerAction | RenameLabwareAction>;
export declare const duplicateLabware: (templateLabwareId: string) => ThunkAction<DuplicateLabwareAction>;
