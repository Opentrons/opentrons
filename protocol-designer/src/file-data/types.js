// @flow
import type { SchemaV1ProtocolFile } from '@opentrons/shared-data'
export type FileMetadataFields = $PropertyType<
  SchemaV1ProtocolFile<{}>,
  'metadata'
>

export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
