import type { BrowserWindow } from 'electron'

export type SecondaryWindowType =
  | 'camera-stream'
  | 'camera-photo'
  | 'step-detail-viewer'
  | 'step-detail-data-updated'

export interface SecondaryWindowDetails {
  type: SecondaryWindowType
  key: string
  createUi: (...args: any[]) => BrowserWindow
}
