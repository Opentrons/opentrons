import type { BrowserWindow } from 'electron'
import type { Action } from './types'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

export function clearMainWindow(): void {
  mainWindow = null
}

export function dispatchActionToMainWindow(action: Action): void {
  if (mainWindow != null && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dispatch', action)
  }
}
