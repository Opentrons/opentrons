// @flow
import type {FileMetadataFields} from './types'

export const saveFileMetadata = (payload: FileMetadataFields) => ({
  type: 'SAVE_FILE_METADATA',
  payload,
})
