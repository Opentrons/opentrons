// @flow
import type { SchemaV3ProtocolFile } from '@opentrons/shared-data'
export type FileMetadataFields = $PropertyType<
  SchemaV3ProtocolFile<{}>,
  'metadata'
>

export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
