// robot actions and action types

export const CONNECT = 'robot:CONNECT'

export const DISCONNECT = 'robot:DISCONNECT'

export interface ConnectAction {
  type: typeof CONNECT
  payload: {
    name: string
  }
}

export interface DisconnectAction {
  type: typeof DISCONNECT
}

export type Action = ConnectAction | DisconnectAction

export const connect = (name: string): ConnectAction => {
  return {
    type: CONNECT,
    payload: { name },
  }
}

export const disconnect = (): DisconnectAction => {
  return { type: DISCONNECT }
}
