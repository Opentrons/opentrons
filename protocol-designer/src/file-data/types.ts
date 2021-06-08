import { ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV5'
export type FileMetadataFields = ProtocolFile<{}>['metadata']
export type FileMetadataFieldAccessors = keyof FileMetadataFields
export type SaveFileMetadataAction = {
  type: 'SAVE_FILE_METADATA'
  payload: FileMetadataFields
}
