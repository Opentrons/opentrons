// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {
  saveFileMetadata,
  updateFileMetadataFields
} from '../actions'
import type {FileMetadataFields} from '../types'

const defaultFields = {
  name: '',
  author: '',
  description: ''
}

const unsavedMetadataForm = handleActions({
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
