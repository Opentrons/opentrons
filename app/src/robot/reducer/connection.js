// @flow
// robot connection state and reducer
import type { Action } from '../../types'

import type {
  ConnectAction,
  ConnectResponseAction,
  ClearConnectResponseAction,
  DisconnectAction,
  DisconnectResponseAction,
} from '../actions'

export type ConnectionState = {
  connectedTo: ?string,
  connectRequest: {
    inProgress: boolean,
    error: ?{ message: string },
    name: string,
  },
  disconnectRequest: {
    inProgress: boolean,
    error: ?{ message: string },
  },
  unexpectedDisconnect: boolean,
}

const INITIAL_STATE: ConnectionState = {
  connectedTo: null,
  connectRequest: { inProgress: false, error: null, name: '' },
  disconnectRequest: { inProgress: false, error: null },
  unexpectedDisconnect: false,
}

export function connectionReducer(
  state?: ConnectionState,
  action: Action
): ConnectionState {
  if (state == null) return INITIAL_STATE

  switch (action.type) {
    case 'robot:CONNECT':
      return handleConnect(state, action)

    case 'robot:CONNECT_RESPONSE':
      return handleConnectResponse(state, action)

    case 'robot:CLEAR_CONNECT_RESPONSE':
      return handleClearConnectResponse(state, action)

    case 'robot:DISCONNECT':
      return handleDisconnect(state, action)

    case 'robot:DISCONNECT_RESPONSE':
      return handleDisconnectResponse(state, action)

    case 'robot:UNEXPECTED_DISCONNECT':
      return { ...state, unexpectedDisconnect: true }
  }

  return state
}

function handleConnect(
  state: ConnectionState,
  action: ConnectAction
): ConnectionState {
  const {
    payload: { name },
  } = action

  return { ...state, connectRequest: { inProgress: true, error: null, name } }
}

function handleConnectResponse(
  state: ConnectionState,
  action: ConnectResponseAction
): ConnectionState {
  const error = action.payload.error || null
  let connectedTo = state.connectRequest.name
  let requestName = ''

  if (error) {
    requestName = connectedTo
    connectedTo = null
  }

  return {
    ...state,
    connectedTo,
    connectRequest: { error, inProgress: false, name: requestName },
  }
}

function handleDisconnect(
  state: ConnectionState,
  action: DisconnectAction
): ConnectionState {
  return { ...state, disconnectRequest: { inProgress: true, error: null } }
}

function handleDisconnectResponse(
  state: ConnectionState,
  action: DisconnectResponseAction
): ConnectionState {
  return {
    ...state,
    connectedTo: null,
    disconnectRequest: { error: null, inProgress: false },
    unexpectedDisconnect: false,
  }
}

function handleClearConnectResponse(
  state: ConnectionState,
  action: ClearConnectResponseAction
): ConnectionState {
  return { ...state, connectRequest: INITIAL_STATE.connectRequest }
}
