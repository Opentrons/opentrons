// @flow
// IPC messenger wrapper
import { ipcMain } from 'electron'
import noop from 'lodash/noop'
import WebSocket from 'ws'
import { fromEvent } from 'rxjs'
import { tap, filter, map, mergeMap } from 'rxjs/operators'

import { getFullConfig } from './config'
import { createLogger } from './log'
import { getMainWindow } from './main-window'

import type { Observable } from 'rxjs'
import type {
  Remote,
  WebSocketRemoteMessage,
  WebSocketRemoteLogMessage,
  WebSocketRemoteDispatchMessage,
} from '@opentrons/app/src/shell/types'
import type { Action } from './types'

const log = createLogger('remote')
const rendererLogger = createLogger('renderer')

const createMainRemote = (): Remote => {
  const dispatch = (action: Action) => {
    const win = getMainWindow()

    if (win) {
      log.silly('Sending action via IPC to renderer', { action })
      win.webContents.send('dispatch', action)
    } else {
      log.warn('attempted to send action to UI without window', { action })
    }
  }

  const inbox = fromEvent(ipcMain, 'dispatch', (event, action) => action).pipe(
    tap(action =>
      log.debug('Received action from renderer via IPC', { action })
    )
  )

  ipcMain.on('log', (_, logEntry) => rendererLogger.log(logEntry))

  return { dispatch, inbox, log: noop }
}

const createWebsocketRemote = (): Remote => {
  const server = new WebSocket.Server({ port: 11201 })

  const dispatch = (action: Action) => {
    const message = JSON.stringify({ channel: 'dispatch', payload: action })
    log.silly('Sending action via WebSocket to renderer', { action })
    Array.from(server.clients)
      .filter(c => c.readyState === WebSocket.OPEN)
      .forEach(c => c.send(message))
  }

  const incoming: Observable<WebSocketRemoteMessage> = fromEvent(
    server,
    'connection'
  ).pipe(
    mergeMap(socket =>
      fromEvent(socket, 'message', event => JSON.parse(event.data))
    )
  )

  incoming.pipe(
    filter(({ channel }) => channel === 'log'),
    tap(({ payload }: WebSocketRemoteLogMessage) => {
      rendererLogger.log(payload)
    })
  )

  const inbox = incoming.pipe(
    filter(({ channel }) => channel === 'dispatch'),
    map(({ payload }: WebSocketRemoteDispatchMessage) => payload),
    tap(action =>
      log.debug('Received action from renderer via WebSocket', { action })
    )
  )

  return { dispatch, inbox, log: noop }
}

export function createRemote(): Remote {
  return getFullConfig().ui.externalBrowser
    ? createWebsocketRemote()
    : createMainRemote()
}
