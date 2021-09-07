import { combineReducers, Reducer } from 'redux'
import { handleActions } from 'redux-actions'
import { Action } from '../types'
import { SetOptIn } from './actions'
import { RehydratePersistedAction } from '../persist'
type OptInState = boolean | null
const optInInitialState = null
// @ts-expect-error(sb, 2021-6-17): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const hasOptedIn: Reducer<OptInState, any> = handleActions(
  {
    SET_OPT_IN: (state: OptInState, action: SetOptIn): OptInState =>
      action.payload,
    REHYDRATE_PERSISTED: (
      state: OptInState,
      action: RehydratePersistedAction
    ) => {
      const persistedState = action.payload?.['analytics.hasOptedIn']
      return persistedState !== undefined ? persistedState : optInInitialState
    },
  },
  optInInitialState
)
const _allReducers = {
  hasOptedIn,
}
export interface RootState {
  hasOptedIn: OptInState
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
