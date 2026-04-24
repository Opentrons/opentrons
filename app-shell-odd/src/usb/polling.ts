import { app } from 'electron'

import { initialized, usbDeviceAdded, usbDeviceRemoved } from '../actions'
import { UI_INITIALIZED } from '../constants'
import { getUsbDevicesNormalized } from './normalize'

import type { UsbDevice } from '@opentrons/app/src/redux/system-info/types'
import type { Action } from '@opentrons/app/src/redux/types'
import type { Dispatch } from '../types'

const POLL_DURATION_MS = 2000

export function registerSystemInfo(
  dispatch: Dispatch
): (action: Action) => void {
  let pollId: NodeJS.Timeout | null = null
  let previousDevices: UsbDevice[] = []
  let hasInitialized = false

  const refresh = async (): Promise<void> => {
    const nextDevices = await getUsbDevicesNormalized()

    if (!hasInitialized) {
      hasInitialized = true
      previousDevices = nextDevices
      dispatch(initialized(nextDevices, []))
      return
    }

    const prevById = new Map(
      previousDevices.map(device => [device.identifier, device])
    )
    const nextById = new Map(
      nextDevices.map(device => [device.identifier, device])
    )

    nextDevices.forEach(device => {
      if (!prevById.has(device.identifier)) {
        dispatch(usbDeviceAdded(device))
      }
    })

    previousDevices.forEach(device => {
      if (!nextById.has(device.identifier)) {
        dispatch(usbDeviceRemoved(device))
      }
    })

    previousDevices = nextDevices
  }

  app.once('will-quit', () => {
    if (pollId != null) {
      clearInterval(pollId)
    }
  })

  return function handleAction(action: Action): void {
    if (action.type === UI_INITIALIZED) {
      void refresh()
      pollId ??= setInterval(() => {
        void refresh()
      }, POLL_DURATION_MS)
    }
  }
}
