// @flow
import type { FileMetadataFields, SaveFileMetadataAction } from './types'

export const saveFileMetadata = (
  payload: FileMetadataFields
): SaveFileMetadataAction => ({
  type: 'SAVE_FILE_METADATA',
  payload,
})
