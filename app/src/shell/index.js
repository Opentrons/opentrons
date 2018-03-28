// @flow
// desktop shell module
import {remote} from 'electron'

import type {State, Action, ThunkPromiseAction, Error} from '../types'

const {checkForUpdates} = remote.require('./update')

type ShellState = {
  update: {
    inProgress: boolean,
    available: ?string,
    error: ?Error,
  },
}

const INITIAL_STATE: ShellState = {
  update: {
    inProgress: false,
    available: null,
    error: null
  }
}

type StartUpdateCheckAction = {|
  type: 'shell:START_UPDATE_CHECK'
|}

type FinishUpdateCheckAction = {|
  type: 'shell:FINISH_UPDATE_CHECK',
  payload: {|
    available: ?string,
    error: ?Error
  |}
|}

export type ShellAction =
  | StartUpdateCheckAction
  | FinishUpdateCheckAction

export function checkForShellUpdates (): ThunkPromiseAction {
  return (dispatch) => {
    dispatch({type: 'shell:START_UPDATE_CHECK'})

    return checkForUpdates()
      .then((available: ?string) => ({available, error: null}))
      .catch((error: Error) => ({error}))
      .then((payload) => dispatch({
        type: 'shell:FINISH_UPDATE_CHECK',
        payload
      }))
  }
}

export function shellReducer (
  state: ?ShellState,
  action: Action
): ShellState {
  if (!state) return INITIAL_STATE

  switch (action.type) {
    case 'shell:START_UPDATE_CHECK':
      return {...state, update: {...state.update, inProgress: true}}

    case 'shell:FINISH_UPDATE_CHECK':
      return {
        ...state,
        update: {...state.update, ...action.payload, inProgress: false}}
  }

  return state
}

export function getShellUpdate (state: State) {
  return state.shell.update
}

// DEBUG(mc, 2018-03-28): code review helpers, remove once UI is in place
global.checkForShellUpdates = checkForShellUpdates
global.getShellUpdate = getShellUpdate
