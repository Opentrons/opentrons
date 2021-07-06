import { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV5'
export type FileMetadataFields = ProtocolFile<{}>['metadata']
export type FileMetadataFieldAccessors = keyof FileMetadataFields
export interface SaveFileMetadataAction {
  type: 'SAVE_FILE_METADATA'
  payload: FileMetadataFields
}
