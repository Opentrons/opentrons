// @flow
import type {ProtocolFileV1} from '@opentrons/shared-data'
export type FileMetadataFields = $PropertyType<ProtocolFileV1<{}>, 'metadata'>

export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
