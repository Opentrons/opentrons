import type { ProtocolFile } from '@opentrons/shared-data';
export type FileMetadataFields = ProtocolFile<{}>['metadata'];
export type FileMetadataFieldAccessors = keyof FileMetadataFields;
export interface SaveFileMetadataAction {
    type: 'SAVE_FILE_METADATA';
    payload: FileMetadataFields;
}
