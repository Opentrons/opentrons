// robot connection state and reducer
import omit from 'lodash/omit'
import without from 'lodash/without'

import {actionTypes} from '../actions'

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

const INITIAL_STATE = {
  isScanning: false,
  discovered: [],
  discoveredByHost: {},
  connectedTo: '',
  connectRequest: {inProgress: false, error: null, host: ''},
  disconnectRequest: {inProgress: false, error: null}
}

export default function connectionReducer (state = INITIAL_STATE, action) {
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
  const {payload} = action
  const {host} = payload
  let {discovered, discoveredByHost} = state

  if (discovered.indexOf(host) < 0) {
    discovered = discovered.concat(host)
  }

  discoveredByHost = {
    ...discoveredByHost,
    [host]: {
      ...discoveredByHost[host],
      ...payload
    }
  }

  return {...state, discovered, discoveredByHost}
}

function handleRemoveDiscovered (state, action) {
  const {payload: {host}} = action

  return {
    ...state,
    discovered: without(state.discovered, host),
    discoveredByHost: omit(state.discoveredByHost, host)
  }
}

function handleConnect (state, action) {
  const {payload: {host}} = action

  return {...state, connectRequest: {inProgress: true, error: null, host}}
}

function handleConnectResponse (state, action) {
  const {error: didError} = action
  let connectedTo = state.connectRequest.host
  let error = null
  let requestHost = ''

  if (didError) {
    error = action.payload
    requestHost = connectedTo
    connectedTo = ''
  }

  return {
    ...state,
    connectedTo,
    connectRequest: {error, inProgress: false, host: requestHost}
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
