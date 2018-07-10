// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {FileError} from './types'

// Keep track of file upload errors
const fileErrors = handleActions({
  FILE_ERRORS: (state, action: {payload: FileError}) => action.payload
}, null)

export const _allReducers = {
  fileErrors
}

export type RootState = {
  fileErrors: FileError
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer
