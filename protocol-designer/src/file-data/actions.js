// @flow
import type {FileMetadataFieldAccessors} from './types'
import type {PipetteName} from './pipetteData'

export const updateFileMetadataFields = (payload: {[accessor: FileMetadataFieldAccessors]: string}) => ({
  type: 'UPDATE_FILE_METADATA_FIELDS',
  payload
})

export const saveFileMetadata = (payload: {[accessor: FileMetadataFieldAccessors]: string}) => ({
  type: 'SAVE_FILE_METADATA',
  payload
})

export const updatePipettes = (payload: {['left' | 'right']: ?PipetteName}) => ({
  type: 'UPDATE_PIPETTES',
  payload
})
