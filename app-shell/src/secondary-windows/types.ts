import type { BrowserWindow } from 'electron'

type SecondaryWindowType =
  | 'camera-stream'
  | 'camera-photo'
  | 'step-detail-viewer'

export interface SecondaryWindowDetails {
  type: SecondaryWindowType
  windowId: string
  createUi: (...args: any[]) => BrowserWindow
}
