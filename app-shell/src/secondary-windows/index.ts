/**
 * Manages secondary window lifecycle.
 *
 * Each relevant received action opens a new secondary window if the identifying payload is not already
 * associated with an open window. Otherwise, the window is refocused.
 *
 * It is a decision of the author to decide the payload information is used to determine the uniqueness of a window.
 * Each "type" of open window requires an associated action and secondary window details, see detailsByActionType.
 */

import {
  CAMERA_PHOTO_OPEN,
  CAMERA_STREAM_OPEN,
  STEP_DETAIL_VIEWER_OPEN,
  STEP_DETAIL_VIEWER_UPDATE,
} from '../constants'
import { createLogger } from '../log'
import { openCameraPhoto } from './camera-photo'
import { openCameraStream } from './camera-stream'
import {
  getWindowIdStepDetailViewer,
  openStepDetailViewer,
  updateStepDetailViewerData,
} from './step-detail-viewer'

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

export function isSecondaryWindowOpen(windowId: string): boolean {
  const window = secondaryWindows.get(windowId)
  return window != null && !window.isDestroyed()
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
      return openCameraStream({
        runId: action.payload.runId,
        windowTitle: action.payload.windowTitle,
        robotIp: action.payload.hostname,
        robotName: action.payload.robotName,
        log,
      })
    case CAMERA_PHOTO_OPEN:
      return openCameraPhoto({
        photoUrl: action.payload.photoUrl,
        robotName: action.payload.robotName,
        windowTitle: action.payload.windowTitle,
        log,
      })
    case STEP_DETAIL_VIEWER_OPEN: {
      const windowId = getWindowIdStepDetailViewer(action.payload.protocolKey)
      const existingWindow = secondaryWindows.get(windowId)

      if (existingWindow == null || existingWindow.isDestroyed()) {
        // Window doesn't exist or was destroyed, create new one
        return openStepDetailViewer({
          protocolKey: action.payload.protocolKey,
          slot: action.payload.slot,
          command: action.payload.command,
          robotState: action.payload.robotState,
          invariantContext: action.payload.invariantContext,
          analysis: action.payload.analysis,
          liquids: action.payload.liquids,
          log,
        })
      }

      // Window exists, update its contents and focus it
      updateStepDetailViewerData(action.payload.protocolKey, {
        slot: action.payload.slot,
        command: action.payload.command,
        robotState: action.payload.robotState,
        analysis: action.payload.analysis,
        liquids: action.payload.liquids,
      })
      existingWindow.focus()
      existingWindow.show()
      return null
    }
    case STEP_DETAIL_VIEWER_UPDATE:
      updateStepDetailViewerData(action.payload.protocolKey, {
        slot: action.payload.slot,
        command: action.payload.command,
        robotState: action.payload.robotState,
        analysis: action.payload.analysis,
        liquids: action.payload.liquids,
      })
      return null
    default:
      return null
  }
}

// Open a window, refocusing the window if it is already open.
function openWindow(details: SecondaryWindowDetails): void {
  const { windowId, type, createUi } = details
  const existingWindow = secondaryWindows.get(windowId)

  if (existingWindow != null) {
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus()
      existingWindow.show()
      return
    }
    // If the window exists but is destroyed, remove it from the cache.
    secondaryWindows.delete(windowId)
  }

  log.info(`Opening ${type} window: ${windowId}`)
  const newWindow = createUi()
  secondaryWindows.set(windowId, newWindow)

  newWindow.webContents.once('did-finish-load', () => {
    log.debug(`Did finish load for ${type}`)
    newWindow.webContents.send('window-type', 'secondary')
  })
  newWindow.once('closed', () => {
    log.debug('Camera stream window closed')
    secondaryWindows.delete(windowId)
  })
}
