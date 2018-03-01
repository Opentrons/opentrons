// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {updateFileFields} from '../actions'

import type {FilePageFields} from '../types'

const defaultFields = {
  name: '',
  author: '',
  description: '',
  leftPipette: '',
  rightPipette: ''
}

const metadataFields = handleActions({
  UPDATE_FILE_FIELDS: (state: FilePageFields, action: ActionType<typeof updateFileFields>) => ({
    ...state,
    ...action.payload
  })
}, defaultFields)

export type RootState = {
  metadataFields: FilePageFields
}

const _allReducers = {
  metadataFields
}

export const rootReducer = combineReducers(_allReducers)
