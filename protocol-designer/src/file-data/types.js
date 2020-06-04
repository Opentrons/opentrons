// @flow
import type { ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

export type FileMetadataFields = $PropertyType<ProtocolFile<{}>, 'metadata'>
export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>

export type SaveFileMetadataAction = {|
  type: 'SAVE_FILE_METADATA',
  payload: FileMetadataFields,
|}
