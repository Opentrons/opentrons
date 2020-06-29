// @flow
// system info module
import { UI_INITIALIZED } from '@opentrons/app/src/shell/actions'
import * as SystemInfo from '@opentrons/app/src/system-info'
import type { UsbDevice } from '@opentrons/app/src/system-info/types'
import { app } from 'electron'

import { createLogger } from '../log'
import { isWindows } from '../os'
import type { Action, Dispatch } from '../types'
import type { NetworkInterfaceMonitor } from './network-interfaces'
import {
  createNetworkInterfaceMonitor,
  getActiveInterfaces,
} from './network-interfaces'
import type { Device, UsbDeviceMonitor } from './usb-devices'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from './usb-devices'

export { createNetworkInterfaceMonitor }

const RE_REALTEK = /realtek/i
const IFACE_POLL_INTERVAL_MS = 30000

const log = createLogger('system-info')

const addDriverVersion = (device: Device): Promise<UsbDevice> => {
  if (isWindows() && RE_REALTEK.test(device.manufacturer)) {
    return getWindowsDriverVersion(device).then(windowsDriverVersion => ({
      ...device,
      windowsDriverVersion,
    }))
  }

  return Promise.resolve({ ...device })
}

export function registerSystemInfo(dispatch: Dispatch): Action => void {
  let usbMonitor: UsbDeviceMonitor
  let ifaceMonitor: NetworkInterfaceMonitor

  const handleDeviceAdd = device => {
    addDriverVersion(device).then(d => dispatch(SystemInfo.usbDeviceAdded(d)))
  }

  const handleDeviceRemove = d => {
    dispatch(SystemInfo.usbDeviceRemoved({ ...d }))
  }

  const handleIfacesChanged = interfaces => {
    dispatch(SystemInfo.networkInterfacesChanged(interfaces))
  }

  app.once('will-quit', () => {
    if (usbMonitor) {
      log.debug('stopping usb monitoring')
      usbMonitor.stop()
    }

    if (ifaceMonitor) {
      log.debug('stopping network iface monitoring')
      ifaceMonitor.stop()
    }
  })

  return function handleSystemAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED: {
        usbMonitor =
          usbMonitor ??
          createUsbDeviceMonitor({
            onDeviceAdd: handleDeviceAdd,
            onDeviceRemove: handleDeviceRemove,
          })

        ifaceMonitor =
          ifaceMonitor ??
          createNetworkInterfaceMonitor({
            pollInterval: IFACE_POLL_INTERVAL_MS,
            onInterfaceChange: handleIfacesChanged,
          })

        usbMonitor
          .getAllDevices()
          .then(devices => Promise.all(devices.map(addDriverVersion)))
          .then(devices => {
            dispatch(SystemInfo.initialized(devices, getActiveInterfaces()))
          })
      }
    }
  }
}
