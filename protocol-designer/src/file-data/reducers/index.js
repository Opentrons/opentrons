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
  'protocol-name': '',
  author: '',
  description: '',
}

const updateMetadataFields = (
  state: FileMetadataFields,
  action: LoadFileAction
): FileMetadataFields => {
  const {metadata} = action.payload
  return metadata
}

function newProtocolMetadata (
  state: FileMetadataFields,
  action: {payload: NewProtocolFields}
): FileMetadataFields {
  return {
    ...defaultFields,
    'protocol-name': action.payload.name || '',
    created: Date.now(),
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
  SAVE_PROTOCOL_FILE: (state: FileMetadataFields): FileMetadataFields => {
    // NOTE: 'last-modified' is updated "on-demand", in response to user clicking "save/export"
    return {...state, 'last-modified': Date.now()}
  },
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
