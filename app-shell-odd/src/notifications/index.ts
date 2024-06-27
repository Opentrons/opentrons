import { connectionStore } from './store'
import {
  connectAsync,
  establishListeners,
  closeConnectionForcefully,
} from './connect'
import { subscribe } from './subscribe'
import { notifyLog } from './notifyLog'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'

// Manages the MQTT broker connection through a connection store. Subscriptions are handled "lazily" - a component must
// dispatch a subscribe action before a subscription request is made to the broker. Unsubscribe requests only occur if
// the broker sends an "unsubscribe" flag. Pending subs and unsubs are used to prevent unnecessary network and broker load.

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  // Because of the ODD's start sequence, the browser window will always be defined before relevant actions occur.
  if (connectionStore.getBrowserWindow() == null) {
    connectionStore.setBrowserWindow(mainWindow)
  }

  return function handleAction(action: Action) {
    switch (action.type) {
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe(action.payload.topic)
    }
  }
}

export function establishBrokerConnection(): Promise<void> {
  const { ip, robotName } = connectionStore

  return connectAsync(`mqtt://${connectionStore.ip}`)
    .then(client => {
      notifyLog.debug(`Successfully connected to ${robotName} on ${ip}`)
      void connectionStore
        .setConnected(client)
        .then(() => establishListeners())
        .catch((error: Error) => notifyLog.debug(error.message))
    })
    .catch((error: Error) => {
      notifyLog.warn(
        `Failed to connect to ${robotName} on ${ip} - ${error.name}: ${error.message} `
      )
      void connectionStore.setErrorStatus()
    })
}

export function closeBrokerConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(Error('Failed to close the connection within the time limit.'))
    }, 2000)

    notifyLog.debug(
      `Stopping notify service connection for host ${connectionStore.robotName}`
    )
    const closeConnection = closeConnectionForcefully()
    closeConnection.then(resolve).catch(reject)
  })
}
