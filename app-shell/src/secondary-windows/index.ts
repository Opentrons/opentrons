/**
 * Manages secondary window lifecycle.
 *
 * Each relevant received action opens a new secondary window if the identifying payload is not already
 * associated with an open window. Otherwise, the window is refocused.
 *
 * It is a decision of the author to decide the payload information is used to determine the uniqueness of a window.
 * Each "type" of open window requires an associated action and secondary window details, see detailsByActionType.
 */

import { CAMERA_STREAM_OPEN } from '../constants'
import { createLogger } from '../log'
import { openCameraStream } from './camera-stream'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'
import type { SecondaryWindowDetails } from './types'

const log = createLogger('camera-stream')

// Cache of all BrowserWindows by unique window id.
const secondaryWindows = new Map<string, BrowserWindow>()

export function closeSecondaryWindows(): void {
  secondaryWindows.forEach(window => {
    if (!window.isDestroyed()) {
      window.close()
    }
  })
  secondaryWindows.clear()
}

export function registerCameraStream(
  dispatch: Dispatch
): (action: Action) => unknown {
  return function handleAction(action: Action) {
    const details = detailsByActionType(action)

    if (details != null) {
      openWindow(details)
    }
  }
}

function detailsByActionType(action: Action): SecondaryWindowDetails | null {
  switch (action.type) {
    case CAMERA_STREAM_OPEN:
      return openCameraStream(action.payload.hostname, log)
    default:
      return null
  }
}

// Open a window, refocusing the window if it is already open.
function openWindow(details: SecondaryWindowDetails): void {
  const { windowId, type, createUi } = details
  const window = secondaryWindows.get(windowId)

  if (window && !window.isDestroyed()) {
    window.focus()
    window.show()
  } else {
    // If the window exists but is destroyed, remove it from the cache.
    secondaryWindows.delete(windowId)

    log.info(`Opening ${type} window: ${windowId}`)
    const window = createUi()
    secondaryWindows.set(windowId, window)

    window.once('closed', () => {
      log.debug('Camera stream window closed')
      secondaryWindows.delete(windowId)
    })
  }
}
