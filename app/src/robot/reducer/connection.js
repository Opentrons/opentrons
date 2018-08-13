// @flow
// robot connection state and reducer
import type {Action} from '../../types'

import type {
  ConnectAction,
  ConnectResponseAction,
  ClearConnectResponseAction,
  DisconnectAction,
  DisconnectResponseAction
} from '../actions'

type State = {
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

const INITIAL_STATE: State = {
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
  }

  return state
}

function handleConnect (state: State, action: ConnectAction): State {
  const {payload: {name}} = action

  return {...state, connectRequest: {inProgress: true, error: null, name}}
}

function handleConnectResponse (
  state: State,
  action: ConnectResponseAction
): State {
  const error = action.payload.error || null
  let connectedTo = state.connectRequest.name
  let requestName = ''

  if (error) {
    requestName = connectedTo
    connectedTo = ''
  }

  return {
    ...state,
    connectedTo,
    connectRequest: {error, inProgress: false, name: requestName}
  }
}

function handleDisconnect (state: State, action: DisconnectAction): State {
  return {...state, disconnectRequest: {inProgress: true, error: null}}
}

function handleDisconnectResponse (
  state: State,
  action: DisconnectResponseAction
): State {
  return {
    ...state,
    connectedTo: '',
    disconnectRequest: {error: null, inProgress: false}
  }
}

function handleClearConnectResponse (
  state: State,
  action: ClearConnectResponseAction
): State {
  return {...state, connectRequest: INITIAL_STATE.connectRequest}
}
