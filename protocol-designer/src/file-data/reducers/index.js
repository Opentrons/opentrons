// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {
  saveFileMetadata,
  updateFileMetadataFields
} from '../actions'
import type {FileMetadataFields} from '../types'
import {LOAD_FILE, type LoadFileAction} from '../../load-file'

const defaultFields = {
  name: '',
  author: '',
  description: ''
}

const updateMetadataFields = (
  state: FileMetadataFields,
  action: LoadFileAction
): FileMetadataFields => {
  const {metadata} = action.payload
  return {
    author: metadata.author,
    description: metadata.description,
    name: metadata['protocol-name']
  }
}

const unsavedMetadataForm = handleActions({
  [LOAD_FILE]: updateMetadataFields,
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
  [LOAD_FILE]: updateMetadataFields,
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
