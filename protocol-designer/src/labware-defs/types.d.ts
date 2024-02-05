import { LabwareDefinition2 } from '@opentrons/shared-data';
export type LabwareDefByDefURI = Record<string, LabwareDefinition2>;
export type LabwareUploadMessageType = 'INVALID_JSON_FILE' | 'NOT_JSON' | 'EXACT_LABWARE_MATCH' | 'LABWARE_NAME_CONFLICT' | 'ASK_FOR_LABWARE_OVERWRITE' | 'USES_STANDARD_NAMESPACE';
interface NameConflictFields {
    defsMatchingLoadName: LabwareDefinition2[];
    defsMatchingDisplayName: LabwareDefinition2[];
    newDef: LabwareDefinition2;
}
export type LabwareUploadMessage = {
    messageType: 'INVALID_JSON_FILE' | 'NOT_JSON';
    errorText?: string;
} | {
    messageType: 'EXACT_LABWARE_MATCH' | 'USES_STANDARD_NAMESPACE' | 'ONLY_TIPRACK';
} | (NameConflictFields & {
    messageType: 'LABWARE_NAME_CONFLICT';
}) | (NameConflictFields & {
    messageType: 'ASK_FOR_LABWARE_OVERWRITE';
    defURIToOverwrite: string;
    isOverwriteMismatched: boolean;
});
export {};
