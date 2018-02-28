// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'

import type {BaseState} from '../../types'
import {navigateToPage, toggleNewProtocolModal} from '../actions'
import type {Page} from '../types'

const page = handleActions({
  NAVIGATE_TO_PAGE: (state, action: ActionType<typeof navigateToPage>) => action.payload
}, 'file-detail') // TODO Ian 2018-02-28 this will start on 'file-splash'

const newProtocolModal = handleActions({
  TOGGLE_NEW_PROTOCOL_MODAL: (state, action: ActionType<typeof toggleNewProtocolModal>) =>
    action.payload,
  /** Close modal on NewFileModal form submit */
  UPDATE_FILE_FIELDS: () => false
}, false)

export const _allReducers = {
  page,
  newProtocolModal
}

export type RootState = {
  page: Page,
  newProtocolModal: boolean
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.navigation
