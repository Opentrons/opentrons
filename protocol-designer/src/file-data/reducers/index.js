// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {actions as loadFileActions} from '../../load-file'
import {
  saveFileMetadata,
  updateFileMetadataFields
} from '../actions'
import type {FileMetadataFields} from '../types'

const {LOAD_FILE, loadFile} = loadFileActions

const defaultFields = {
  name: '',
  author: '',
  description: ''
}

const unsavedMetadataForm = handleActions({
  [LOAD_FILE]: () => defaultFields,
  UPDATE_FILE_METADATA_FIELDS: (state: FileMetadataFields, action: ActionType<typeof updateFileMetadataFields>) => ({
    ...state,
    ...action.payload
  }),
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>) => ({
    ...state,
    ...action.payload
  })
}, defaultFields)

const fileMetadata = handleActions({
  [LOAD_FILE]: (state: FileMetadataFields, action: ActionType<typeof loadFile>) => {
    const {metadata} = action.payload
    return {
      author: metadata.author,
      description: metadata.description,
      name: metadata['protocol-name']
    }
  },
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>) => ({
    ...state,
    ...action.payload
  })
}, defaultFields)

export type RootState = {
  unsavedMetadataForm: FileMetadataFields,
  fileMetadata: FileMetadataFields
}

const _allReducers = {
  unsavedMetadataForm,
  fileMetadata
}

export const rootReducer = combineReducers(_allReducers)
