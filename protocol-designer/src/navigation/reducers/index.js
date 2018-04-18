// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'

import type {BaseState} from '../../types'
import {navigateToPage, toggleNewProtocolModal} from '../actions'
import type {Page} from '../types'

const page = handleActions({
  NAVIGATE_TO_PAGE: (state, action: ActionType<typeof navigateToPage>) => action.payload
}, 'file-splash')

const newProtocolModal = handleActions({
  TOGGLE_NEW_PROTOCOL_MODAL: (state, action: ActionType<typeof toggleNewProtocolModal>) =>
    action.payload
}, false)

const wellSelectionModal = handleActions({
  OPEN_WELL_SELECTION_MODAL: () => true,
  CLOSE_WELL_SELECTION_MODAL: () => false
}, false)

export const _allReducers = {
  page,
  newProtocolModal,
  wellSelectionModal
}

export type RootState = {
  page: Page,
  newProtocolModal: boolean,
  wellSelectionModal: boolean
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.navigation
