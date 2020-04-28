// @flow
// system info module
import { app } from 'electron'
import { UI_INITIALIZED } from '@opentrons/app/src/shell/actions'
import * as SystemInfo from '@opentrons/app/src/system-info'
import { isWindows } from '../os'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from './usb-devices'

import type { UsbDevice } from '@opentrons/app/src/system-info/types'
import type { Action, Dispatch } from '../types'
import type { UsbDeviceMonitor, Device } from './usb-devices'

const RE_REALTEK = /realtek/i

const addDriverVersion = (device: Device): Promise<UsbDevice> => {
  if (isWindows() && RE_REALTEK.test(device.manufacturer)) {
    return getWindowsDriverVersion(device).then(windowsDriverVersion => ({
      ...device,
      windowsDriverVersion,
    }))
  }

  return Promise.resolve({ ...device })
}

export function registerSystemInfo(dispatch: Dispatch) {
  let monitor: UsbDeviceMonitor

  const handleDeviceAdd = device => {
    addDriverVersion(device).then(d => dispatch(SystemInfo.usbDeviceAdded(d)))
  }

  const handleDeviceRemove = d => {
    dispatch(SystemInfo.usbDeviceRemoved({ ...d }))
  }

  app.once('will-quit', () => {
    if (monitor) monitor.stop()
  })

  return function handleSystemAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED: {
        if (!monitor) {
          monitor = createUsbDeviceMonitor({
            onDeviceAdd: handleDeviceAdd,
            onDeviceRemove: handleDeviceRemove,
          })

          monitor
            .getAllDevices()
            .then(devices => Promise.all(devices.map(addDriverVersion)))
            .then(devices => dispatch(SystemInfo.initialized(devices)))
        }
      }
    }
  }
}
