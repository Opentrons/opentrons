import type { BaseState, Selector } from '../../types';
import type { RootState } from '../reducers';
import type { FileMetadataFields } from '../types';
import type { RobotType } from '@opentrons/shared-data';
export declare const rootSelector: (state: BaseState) => RootState;
export declare const getCurrentProtocolExists: Selector<boolean>;
export declare const protocolName: Selector<FileMetadataFields['protocolName']>;
export declare const getFileMetadata: Selector<FileMetadataFields>;
export declare const getRobotType: Selector<RobotType>;
