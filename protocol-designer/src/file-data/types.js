// @flow
import type {ProtocolFile} from '../file-types'
export type FileMetadataFields = $PropertyType<ProtocolFile, 'metadata'>

export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
