// @flow
// robot connection state and reducer
import omit from 'lodash/omit'
import without from 'lodash/without'

import type {Action} from '../../types'

import type {
  HealthSuccessAction,
  HealthFailureAction
} from '../../http-api-client'

import type {RobotService} from '../types'

import {actionTypes, type ClearConnectResponseAction} from '../actions'

type State = {
  isScanning: boolean,
  discovered: string[],
  discoveredByName: {
    [string]: RobotService
  },
  connectedTo: string,
  connectRequest: {
    inProgress: boolean,
    error: ?{message: string},
    name: string
  },
  disconnectRequest: {
    inProgress: boolean,
    error: ?{message: string}
  },
}

// TODO(mc, 2018-01-11): import union of discrete action types from actions
const {
  DISCOVER,
  DISCOVER_FINISH,
  ADD_DISCOVERED,
  REMOVE_DISCOVERED,
  CONNECT,
  CONNECT_RESPONSE,
  DISCONNECT,
  DISCONNECT_RESPONSE
} = actionTypes

const INITIAL_STATE: State = {
  isScanning: false,
  discovered: [],
  discoveredByName: {},
  connectedTo: '',
  connectRequest: {inProgress: false, error: null, name: ''},
  disconnectRequest: {inProgress: false, error: null}
}

export default function connectionReducer (
  state?: State,
  action: Action
): State {
  if (state == null) return INITIAL_STATE

  switch (action.type) {
    case DISCOVER: return handleDiscover(state)
    case DISCOVER_FINISH: return handleDiscoverFinish(state)
    case ADD_DISCOVERED: return handleAddDiscovered(state, action)
    case REMOVE_DISCOVERED: return handleRemoveDiscovered(state, action)
    case CONNECT: return handleConnect(state, action)
    case CONNECT_RESPONSE: return handleConnectResponse(state, action)
    case DISCONNECT: return handleDisconnect(state, action)
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)

    case 'robot:CLEAR_CONNECT_RESPONSE':
      return handleClearConnectResponse(state, action)

    case 'api:HEALTH_SUCCESS':
      return maybeDiscoverWired(state, action)

    case 'api:HEALTH_FAILURE':
      return maybeRemoveWired(state, action)
  }

  return state
}

function handleDiscover (state: State): State {
  return {
    ...state,
    isScanning: true
  }
}

function handleDiscoverFinish (state: State): State {
  return {
    ...state,
    isScanning: false
  }
}

function handleAddDiscovered (state: State, action: any): State {
  if (!action.payload) return state

  const {payload} = action
  const {name} = payload
  let {discovered, discoveredByName} = state

  if (discovered.indexOf(name) < 0) {
    discovered = discovered.concat(name)
  }

  discoveredByName = {
    ...discoveredByName,
    [name]: {
      ...discoveredByName[name],
      ...payload
    }
  }

  return {...state, discovered, discoveredByName}
}

function handleRemoveDiscovered (state: State, action: any): State {
  if (!action.payload || state.connectedTo === action.payload.name) {
    return state
  }

  const {payload: {name}} = action

  return {
    ...state,
    discovered: without(state.discovered, name),
    discoveredByName: omit(state.discoveredByName, name)
  }
}

function handleConnect (state: State, action: any): State {
  if (!action.payload) return state

  const {payload: {name}} = action

  return {...state, connectRequest: {inProgress: true, error: null, name}}
}

function handleConnectResponse (state: State, action: any): State {
  const {error: didError} = action
  let connectedTo = state.connectRequest.name
  let error = null
  let requestName = ''

  if (didError) {
    error = action.payload
    requestName = connectedTo
    connectedTo = ''
  }

  return {
    ...state,
    connectedTo,
    connectRequest: {error, inProgress: false, name: requestName}
  }
}

function handleDisconnect (state: State, action: any): State {
  return {...state, disconnectRequest: {inProgress: true, error: null}}
}

function handleDisconnectResponse (state, action: any) {
  const {error: didError} = action
  let connectedTo = ''
  let error = null

  if (didError) {
    connectedTo = state.connectedTo
    error = action.payload
  }

  return {...state, connectedTo, disconnectRequest: {error, inProgress: false}}
}

function handleClearConnectResponse (
  state: State,
  action: ClearConnectResponseAction
): State {
  return {...state, connectRequest: INITIAL_STATE.connectRequest}
}

function maybeDiscoverWired (state: State, action: HealthSuccessAction): State {
  const robot = action.payload.robot

  if (!robot.wired) return state

  return handleAddDiscovered(state, {payload: robot})
}

function maybeRemoveWired (state: State, action: HealthFailureAction): State {
  const robot = action.payload.robot

  if (!robot.wired) return state

  return handleRemoveDiscovered(state, {payload: robot})
}
