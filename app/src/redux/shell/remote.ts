// access main process remote modules via attachments to `global`
import { fromEvent } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'

import type { Observable } from 'rxjs'
import type { LogEntry } from '../../logger'
import type { Action } from '../types'

export interface Remote {
  dispatch: (action: Action) => void
  log: (entry: LogEntry) => void
  inbox: Observable<Action>
}

export interface WebSocketRemoteDispatchMessage {
  channel: 'dispatch'
  payload: Action
}

export interface WebSocketRemoteLogMessage {
  channel: 'log'
  payload: LogEntry
}

export type WebSocketRemoteMessage =
  | WebSocketRemoteDispatchMessage
  | WebSocketRemoteLogMessage

export const remote: Remote = initializeRemote()

function initializeRemote(): Remote {
  // if no Electron remote attached to window, we're running headless
  // in a browser. Set up a WebSocket remote instead.
  if (global.APP_SHELL_REMOTE == null) {
    return initializeWebsocketRemote()
  }

  const { ipcRenderer } = global.APP_SHELL_REMOTE

  const dispatch = (action: Action): void => {
    ipcRenderer.send('dispatch', action)
  }

  const log = (entry: LogEntry): void => {
    ipcRenderer.send('log', entry)
  }

  const inbox = fromEvent(
    ipcRenderer,
    'dispatch',
    (event: unknown, action: Action) => action
  )

  return { dispatch, log, inbox }
}

function initializeWebsocketRemote(): Remote {
  const ws = webSocket<WebSocketRemoteMessage>('ws://localhost:11201')

  const inbox = ws.pipe(
    filter(
      (msg): msg is WebSocketRemoteDispatchMessage => msg.channel === 'dispatch'
    ),
    map((msg: WebSocketRemoteDispatchMessage) => msg.payload)
  )

  const dispatch = (payload: Action): void => {
    ws.next({ channel: 'dispatch', payload })
  }

  const log = (payload: LogEntry): void => {
    ws.next({ channel: 'log', payload })
  }

  return { dispatch, log, inbox }
}
