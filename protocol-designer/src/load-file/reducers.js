// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {FileError} from './types'

// Keep track of file upload errors
const fileErrors = handleActions({
  FILE_ERRORS: (state, action: {payload: FileError}) => action.payload,
}, null)

// NOTE: whenever we add or change any of the action types that indicate
// "changes to the protocol", those action types need to be updated here.
const unsavedChanges = (state: boolean = false, action: {type: string}): boolean => {
  switch (action.type) {
    case 'LOAD_FILE':
    case 'SAVE_PROTOCOL_FILE':
      return false
    case 'CREATE_NEW_PROTOCOL':
    case 'DISMISS_FORM_WARNING':
    case 'DISMISS_TIMELINE_WARNING':
    case 'CREATE_CONTAINER':
    case 'DELETE_CONTAINER':
    case 'MODIFY_CONTAINER':
    case 'MOVE_LABWARE':
    case 'EDIT_MODE_INGREDIENT_GROUP':
    case 'DELETE_INGREDIENT':
    case 'EDIT_INGREDIENT':
    case 'ADD_STEP':
    case 'DELETE_STEP':
    case 'SAVE_STEP_FORM':
    case 'SAVE_FILE_METADATA':
      return true
    default:
      return state
  }
}

export const _allReducers = {
  fileErrors,
  unsavedChanges,
}

export type RootState = {
  fileErrors: FileError,
  unsavedChanges: boolean,
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer
