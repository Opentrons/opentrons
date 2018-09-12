// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'

import {navigateToPage, toggleNewProtocolModal} from '../actions'
import type {BaseState} from '../../types'
import type {Page} from '../types'

const page = handleActions({
  LOAD_FILE: (): Page => 'file-detail',
  CREATE_NEW_PROTOCOL: (): Page => 'file-detail',
  NAVIGATE_TO_PAGE: (state, action: ActionType<typeof navigateToPage>) => action.payload,
}, 'file-splash')

const newProtocolModal = handleActions({
  TOGGLE_NEW_PROTOCOL_MODAL: (state, action: ActionType<typeof toggleNewProtocolModal>): boolean =>
    action.payload,
  CREATE_NEW_PROTOCOL: () => false,
}, false)

export const _allReducers = {
  page,
  newProtocolModal,
}

export type RootState = {
  page: Page,
  newProtocolModal: boolean,
  wellSelectionModal: boolean,
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.navigation
