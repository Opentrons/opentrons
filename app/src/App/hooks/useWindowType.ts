import { useEffect, useState } from 'react'

import { remote } from '/app/redux/shell/remote'

import type { IpcMainEvent } from 'electron'
import type { WindowType } from '../types'

/**
 * TODO(jh, 09-08-25): Ensure window type is retrievable after window instantiation. EXEC-1823.
 * Returns the type of window spawned by the shell.
 */
export function useWindowType(): WindowType {
  const [windowType, setWindowType] = useState<WindowType>(null)

  useEffect(() => {
    try {
      // Listen for window type from main process
      const handleWindowType = (_: IpcMainEvent, type: string): void => {
        if (
          type === 'desktop-main' ||
          type === 'odd-main' ||
          type === 'secondary'
        ) {
          setWindowType(type)
        } else {
          console.error(`Received unhandled window type from shell ${type}`)
        }
      }

      remote.ipcRenderer.on('window-type', handleWindowType)

      return () => {
        remote.ipcRenderer.off('window-type', handleWindowType)
      }
    } catch (error) {
      console.error('Failed to setup window type listener:', error)
      // Fallback to desktop main window if electron APIs not available
      setWindowType('desktop-main')
    }
  }, [])

  return windowType
}
