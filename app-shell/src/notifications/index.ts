import type { Action, Dispatch } from '../types'
import type { BrowserWindow } from 'electron'
import { connectionStore } from '../notify'

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  if (connectionStore.browserWindow == null) {
    connectionStore.browserWindow = mainWindow
  }

  return function handleAction(action: Action) {
    switch (action.type) {
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe({
          ...action.payload,
        })
    }
  }
}
