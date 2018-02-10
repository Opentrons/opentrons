// @flow
// robot connection state and reducer
import omit from 'lodash/omit'
import without from 'lodash/without'

import {actionTypes} from '../actions'

export type State = {
  isScanning: boolean,
  discovered: string[],
  discoveredByName: {
    [string]: {
      name: String,
      ip: String,
      host: String,
      port: number
    }
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
type Action = {
  type: string,
  payload?: any,
  error?: boolean,
  meta?: {}
}

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
  state: State = INITIAL_STATE,
  action: Action
): State {
  switch (action.type) {
    case DISCOVER: return handleDiscover(state, action)
    case DISCOVER_FINISH: return handleDiscoverFinish(state, action)
    case ADD_DISCOVERED: return handleAddDiscovered(state, action)
    case REMOVE_DISCOVERED: return handleRemoveDiscovered(state, action)
    case CONNECT: return handleConnect(state, action)
    case CONNECT_RESPONSE: return handleConnectResponse(state, action)
    case DISCONNECT: return handleDisconnect(state, action)
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
  }

  return state
}

function handleDiscover (state, action) {
  return {
    ...state,
    isScanning: true
  }
}

function handleDiscoverFinish (state, action) {
  return {
    ...state,
    isScanning: false
  }
}

function handleAddDiscovered (state, action) {
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

function handleRemoveDiscovered (state, action) {
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

function handleConnect (state, action) {
  if (!action.payload) return state

  const {payload: {name}} = action

  return {...state, connectRequest: {inProgress: true, error: null, name}}
}

function handleConnectResponse (state, action) {
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

function handleDisconnect (state, action) {
  return {...state, disconnectRequest: {inProgress: true, error: null}}
}

function handleDisconnectResponse (state, action) {
  const {error: didError} = action
  let connectedTo = ''
  let error = null

  if (didError) {
    connectedTo = state.connectedTo
    error = action.payload
  }

  return {...state, connectedTo, disconnectRequest: {error, inProgress: false}}
}
