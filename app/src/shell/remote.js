// @flow
// access main process remote modules via attachments to `global`
import { fromEvent } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'

import type { Action } from '../types'
import type { LogEntry } from '../logger'
import type {
  Remote,
  WebSocketRemoteMessage,
  WebSocketRemoteDispatchMessage,
} from './types'

export const remote: Remote = initializeRemote()

function initializeRemote(): Remote {
  if (global.APP_SHELL_REMOTE) {
    const { ipcRenderer } = global.APP_SHELL_REMOTE
    const dispatch = (action: Action) => ipcRenderer.send('dispatch', action)
    const log = (entry: LogEntry) => ipcRenderer.send('log', entry)

    const inbox = fromEvent(
      ipcRenderer,
      'dispatch',
      (event: mixed, action: Action) => action
    )

    return { dispatch, log, inbox }
  }

  return initializeWebsocketRemote()
}

function initializeWebsocketRemote(): Remote {
  const ws = webSocket<WebSocketRemoteMessage>('ws://localhost:11201')
  const inbox = ws.pipe(
    filter(msg => msg.channel === 'dispatch'),
    map((msg: WebSocketRemoteDispatchMessage) => msg.payload)
  )
  const dispatch = payload => ws.next({ channel: 'dispatch', payload })
  const log = payload => ws.next({ channel: 'log', payload })

  return { dispatch, log, inbox }
}
