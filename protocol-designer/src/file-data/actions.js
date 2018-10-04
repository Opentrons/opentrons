// @flow
import type {FileMetadataFieldAccessors} from './types'

export const updateFileMetadataFields = (payload: {[accessor: FileMetadataFieldAccessors]: mixed}) => ({
  type: 'UPDATE_FILE_METADATA_FIELDS',
  payload,
})

export const saveFileMetadata = (payload: {[accessor: FileMetadataFieldAccessors]: mixed}) => ({
  type: 'SAVE_FILE_METADATA',
  payload,
})
