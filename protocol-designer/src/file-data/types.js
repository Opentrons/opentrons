// @flow
import type { ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'

export type FileMetadataFields = $PropertyType<ProtocolFile<{}>, 'metadata'>
export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
