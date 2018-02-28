// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import {createSelector} from 'reselect'
import {updateFileFields} from '../actions'

import type {FilePageFields} from '../types'
import type {BaseState} from '../../types'

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

// ===== SELECTORS =====

const rootSelector = (state: BaseState): RootState => state.fileData

const fileFormValues = createSelector(
  rootSelector,
  state => state.metadataFields
)

export const selectors = {
  fileFormValues
}
