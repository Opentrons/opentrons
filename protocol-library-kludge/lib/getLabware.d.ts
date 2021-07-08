import type { LabwareDefinition1, LabwareDefinition2 } from '@opentrons/shared-data';
export declare function getLegacyLabwareDef(loadName: string | null | undefined): LabwareDefinition1 | null;
export declare function getLatestLabwareDef(loadName: string | null | undefined): LabwareDefinition2 | null;
