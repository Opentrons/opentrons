import { LabwareDefinition1, LabwareDefinition2 } from '@opentrons/shared-data';
import { LabwareDefByDefURI } from './types';
export declare function getLegacyLabwareDef(loadName: string | null | undefined): LabwareDefinition1 | null;
export declare function getAllDefinitions(): LabwareDefByDefURI;
export declare function getOnlyLatestDefs(): LabwareDefByDefURI;
export declare function _getSharedLabware(labwareDefURI: string): LabwareDefinition2 | null | undefined;
