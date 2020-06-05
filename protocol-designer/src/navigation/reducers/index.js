// @flow
import { combineReducers, type Reducer } from 'redux'
import { handleActions } from 'redux-actions'

import type { BaseState, Action } from '../../types'
import type {
  NavigateToPageAction,
  ToggleNewProtocolModalAction,
} from '../actions'
import type { Page } from '../types'

const page: Reducer<Page, any> = handleActions(
  {
    LOAD_FILE: (): Page => 'file-detail',
    CREATE_NEW_PROTOCOL: (): Page => 'file-detail',
    NAVIGATE_TO_PAGE: (state, action: NavigateToPageAction) => action.payload,
  },
  'file-splash'
)

const newProtocolModal: Reducer<boolean, any> = handleActions(
  {
    TOGGLE_NEW_PROTOCOL_MODAL: (
      state,
      action: ToggleNewProtocolModalAction
    ): boolean => action.payload,
    CREATE_NEW_PROTOCOL: () => false,
  },
  false
)

export const _allReducers = {
  page,
  newProtocolModal,
}

export type RootState = {|
  page: Page,
  newProtocolModal: boolean,
|}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)

export const rootSelector = (state: BaseState): RootState => state.navigation
