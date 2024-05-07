import type { IpcMainEvent } from 'electron'

export interface Remote {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => Promise<any>
    send: (channel: string, ...args: unknown[]) => void
    on: (channel: string, listener: IpcListener) => void
    off: (channel: string, listener: IpcListener) => void
  }
}

export type IpcListener = (
  event: IpcMainEvent,
  ...args: unknown[]
) => void