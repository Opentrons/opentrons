import type { BrowserWindow } from 'electron'

type SecondaryWindowType = 'camera-stream'

export interface SecondaryWindowDetails {
  type: SecondaryWindowType
  windowId: string
  createUi: (...args: any[]) => BrowserWindow
}
