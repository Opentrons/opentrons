// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {
  saveFileMetadata,
  updateFileMetadataFields,
} from '../actions'
import type {FileMetadataFields} from '../types'
import type {LoadFileAction, NewProtocolFields} from '../../load-file'

const defaultFields = {
  name: '',
  author: '',
  description: '',
}

const updateMetadataFields = (
  state: FileMetadataFields,
  action: LoadFileAction
): FileMetadataFields => {
  const {metadata} = action.payload
  return {
    author: metadata.author,
    description: metadata.description,
    name: metadata['protocol-name'],
  }
}

function newProtocolMetadata (
  state: FileMetadataFields,
  action: {payload: NewProtocolFields}
): FileMetadataFields {
  return {
    ...defaultFields,
    name: action.payload.name || '',
  }
}

const unsavedMetadataForm = handleActions({
  LOAD_FILE: updateMetadataFields,
  CREATE_NEW_PROTOCOL: newProtocolMetadata,
  UPDATE_FILE_METADATA_FIELDS: (state: FileMetadataFields, action: ActionType<typeof updateFileMetadataFields>): FileMetadataFields => ({
    ...state,
    ...action.payload,
  }),
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>): FileMetadataFields => ({
    ...state,
    ...action.payload,
  }),
}, defaultFields)

const fileMetadata = handleActions({
  LOAD_FILE: updateMetadataFields,
  CREATE_NEW_PROTOCOL: newProtocolMetadata,
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>): FileMetadataFields => ({
    ...state,
    ...action.payload,
  }),
}, defaultFields)

export type RootState = {
  unsavedMetadataForm: FileMetadataFields,
  fileMetadata: FileMetadataFields,
}

const _allReducers = {
  unsavedMetadataForm,
  fileMetadata,
}

export const rootReducer = combineReducers(_allReducers)
