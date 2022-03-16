// robot connection state and reducer
import type { Action } from '../../types'

export interface ConnectionState {
  connectedTo: string | null
}

const INITIAL_STATE: ConnectionState = {
  connectedTo: null,
}

export function connectionReducer(
  state: ConnectionState | null,
  action: Action
): ConnectionState {
  if (state == null) return INITIAL_STATE

  switch (action.type) {
    case 'robot:CONNECT':
      return { ...state, connectedTo: action.payload.name }

    case 'robot:DISCONNECT':
      return { ...state, connectedTo: null }
  }

  return state
}
