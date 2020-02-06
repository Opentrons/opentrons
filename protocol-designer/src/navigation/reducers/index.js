// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'

import { navigateToPage, toggleNewProtocolModal } from '../actions'
import type { BaseState, Action } from '../../types'
import type { Page } from '../types'

const page = handleActions<Page, *>(
  {
    LOAD_FILE: (): Page => 'file-detail',
    CREATE_NEW_PROTOCOL: (): Page => 'file-detail',
    NAVIGATE_TO_PAGE: (state, action: ActionType<typeof navigateToPage>) =>
      action.payload,
  },
  'file-splash'
)

const newProtocolModal = handleActions<boolean, *>(
  {
    TOGGLE_NEW_PROTOCOL_MODAL: (
      state,
      action: ActionType<typeof toggleNewProtocolModal>
    ): boolean => action.payload,
    CREATE_NEW_PROTOCOL: () => false,
  },
  false
)

export const _allReducers = {
  page,
  newProtocolModal,
}

export type RootState = {
  page: Page,
  newProtocolModal: boolean,
}

const rootReducer = combineReducers<_, Action>(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.navigation
