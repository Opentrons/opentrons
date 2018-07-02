// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'

import {navigateToPage, toggleNewProtocolModal} from '../actions'
import {LOAD_FILE} from '../../load-file'
import type {BaseState} from '../../types'
import type {Page} from '../types'

const page = handleActions({
  [LOAD_FILE]: (): Page => 'file-detail',
  NAVIGATE_TO_PAGE: (state, action: ActionType<typeof navigateToPage>) => action.payload
}, 'file-splash')

const newProtocolModal = handleActions({
  TOGGLE_NEW_PROTOCOL_MODAL: (state, action: ActionType<typeof toggleNewProtocolModal>) =>
    action.payload
}, false)

export const _allReducers = {
  page,
  newProtocolModal
}

export type RootState = {
  page: Page,
  newProtocolModal: boolean,
  wellSelectionModal: boolean
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.navigation
