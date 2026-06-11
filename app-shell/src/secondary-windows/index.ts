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
  STEP_DETAIL_VIEWER_CLOSE,
  STEP_DETAIL_VIEWER_CLOSED,
  STEP_DETAIL_VIEWER_OPEN,
  STEP_DETAIL_VIEWER_UPDATE,
} from '../constants'
import { createLogger } from '../log'
import { openCameraPhoto } from './camera-photo'
import { openCameraStream } from './camera-stream'
import {
  clearStepDetailViewerData,
  openStepDetailViewer,
  updateStepDetailViewerData,
} from './step-detail-viewer'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'
import type { SecondaryWindowDetails, SecondaryWindowType } from './types'

const log = createLogger('camera-stream')

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

export function clearMainWindow(): void {
  mainWindow = null
}

function dispatchActionToMainWindow(action: Action): void {
  if (mainWindow != null && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dispatch', action)
  }
}

const secondaryWindows = new Map<
  SecondaryWindowType,
  Map<string, BrowserWindow>
>()

function getWindow(
  type: SecondaryWindowType,
  key: string
): BrowserWindow | undefined {
  return secondaryWindows.get(type)?.get(key)
}

function setWindow(
  type: SecondaryWindowType,
  key: string,
  window: BrowserWindow
): void {
  const windowsForType = secondaryWindows.get(type) ?? new Map()
  windowsForType.set(key, window)
  secondaryWindows.set(type, windowsForType)
}

function deleteWindow(type: SecondaryWindowType, key: string): void {
  secondaryWindows.get(type)?.delete(key)
}

export function closeSecondaryWindows(): void {
  secondaryWindows.forEach(windowsForType => {
    windowsForType.forEach(window => {
      if (!window.isDestroyed()) {
        window.close()
      }
    })
  })
  secondaryWindows.clear()
}

export function isSecondaryWindowOpen(
  type: SecondaryWindowType,
  key: string
): boolean {
  const window = getWindow(type, key)
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
      const existingWindow = getWindow(
        'step-detail-viewer',
        action.payload.protocolKey
      )

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
        slot: action.payload.slot ?? undefined,
        command: action.payload.command,
        robotState: action.payload.robotState,
        analysis: action.payload.analysis,
        liquids: action.payload.liquids,
      })
      return null

    case STEP_DETAIL_VIEWER_CLOSE: {
      const existingWindow = getWindow(
        'step-detail-viewer',
        action.payload.protocolKey
      )
      if (existingWindow != null && !existingWindow.isDestroyed()) {
        existingWindow.close()
      }
      deleteWindow('step-detail-viewer', action.payload.protocolKey)
      return null
    }

    default:
      return null
  }
}

// Open a window, refocusing the window if it is already open.
function openWindow(details: SecondaryWindowDetails): void {
  const { key, type, createUi } = details
  const existingWindow = getWindow(type, key)

  if (existingWindow != null) {
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus()
      existingWindow.show()
      return
    }
    // If the window exists but is destroyed, remove it from the cache.
    deleteWindow(type, key)
  }

  log.info(`Opening ${type} window: ${key}`)
  const newWindow = createUi()
  setWindow(type, key, newWindow)

  newWindow.webContents.on('did-finish-load', () => {
    log.debug(`Did finish load for ${type}`)
    newWindow.webContents.send('window-type', 'secondary')
  })
  newWindow.once('closed', () => {
    log.debug(`${type} window closed`)
    deleteWindow(type, key)

    if (type === 'step-detail-viewer') {
      // `key` is the protocolKey for step-detail-viewer windows.
      clearStepDetailViewerData(key)

      dispatchActionToMainWindow({
        type: STEP_DETAIL_VIEWER_CLOSED,
        payload: { protocolKey: key },
      })
    }
  })
}
