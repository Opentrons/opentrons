// robot connection state and reducer
import omit from 'lodash/omit'
import without from 'lodash/without'

import {actionTypes} from '../actions'

const {
  CONNECT,
  CONNECT_RESPONSE,
  DISCONNECT,
  DISCONNECT_RESPONSE,
  ADD_DISCOVERED,
  REMOVE_DISCOVERED
} = actionTypes

const INITIAL_STATE = {
  connectRequest: {inProgress: false, error: null},
  disconnectRequest: {inProgress: false, error: null},
  isConnected: false,
  discovered: [],
  discoveredByHostname: {}
}

export default function connectionReducer (state = INITIAL_STATE, action) {
  switch (action.type) {
    case CONNECT: return handleConnect(state, action)
    case CONNECT_RESPONSE: return handleConnectResponse(state, action)
    case DISCONNECT: return handleDisconnect(state, action)
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
    case ADD_DISCOVERED: return handleAddDiscovered(state, action)
    case REMOVE_DISCOVERED: return handleRemoveDiscovered(state, action)
  }

  return state
}

function handleConnect (state, action) {
  return {...state, connectRequest: {inProgress: true, error: null}}
}

function handleConnectResponse (state, action) {
  const {error: didError} = action
  const isConnected = !didError
  const error = didError
    ? action.payload
    : null

  return {...state, isConnected, connectRequest: {inProgress: false, error}}
}

function handleDisconnect (state, action) {
  return {...state, disconnectRequest: {inProgress: true, error: null}}
}

// TODO(mc, 2017-10-04): disconnect response actions are not FSA compliant
function handleDisconnectResponse (state, action) {
  const {error: didError} = action
  const isConnected = !!didError
  const error = didError
    ? action.payload
    : null

  return {...state, isConnected, disconnectRequest: {inProgress: false, error}}
}

function handleAddDiscovered (state, action) {
  const {payload} = action
  const {hostname} = payload

  return {
    ...state,
    discovered: state.discovered.concat(hostname),
    discoveredByHostname: {
      ...state.discoveredByHostname,
      [hostname]: payload
    }
  }
}

function handleRemoveDiscovered (state, action) {
  const {payload: {hostname}} = action

  return {
    ...state,
    discovered: without(state.discovered, hostname),
    discoveredByHostname: omit(state.discoveredByHostname, hostname)
  }
}
