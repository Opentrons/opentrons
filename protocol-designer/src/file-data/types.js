// @flow
import type { ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

export type FileMetadataFields = $PropertyType<ProtocolFile<{}>, 'metadata'>
export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
