// system info module
import { app } from 'electron'
import { UI_INITIALIZED } from '../constants'
import { createLogger } from '../log'
import { isWindows } from '../os'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from './usb-devices'
import {
  createNetworkInterfaceMonitor,
  getActiveInterfaces,
} from './network-interfaces'

import type { UsbDevice } from '@opentrons/app/src/redux/system-info/types'
import type { Action, Dispatch } from '../types'
import type { UsbDeviceMonitor } from './usb-devices'
import type {
  NetworkInterface,
  NetworkInterfaceMonitor,
} from './network-interfaces'
import {
  initialized,
  networkInterfacesChanged,
  usbDeviceAdded,
  usbDeviceRemoved,
} from '../config/actions'

export { createNetworkInterfaceMonitor }
export type { NetworkInterface, NetworkInterfaceMonitor }

const RE_REALTEK = /realtek/i
const IFACE_POLL_INTERVAL_MS = 30000

const log = createLogger('system-info')

const addDriverVersion = (device: UsbDevice): Promise<UsbDevice> => {
  if (
    isWindows() &&
    device.manufacturerName != null &&
    RE_REALTEK.test(device.manufacturerName)
  ) {
    return getWindowsDriverVersion(device).then(windowsDriverVersion => ({
      ...device,
      windowsDriverVersion,
    }))
  }

  return Promise.resolve(device)
}

export function registerSystemInfo(
  dispatch: Dispatch
): (action: Action) => void {
  let usbMonitor: UsbDeviceMonitor
  let ifaceMonitor: NetworkInterfaceMonitor

  const handleDeviceAdd = (device: UsbDevice): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    addDriverVersion(device).then(d => dispatch(usbDeviceAdded(d)))
  }

  const handleDeviceRemove = (d: UsbDevice): void => {
    dispatch(usbDeviceRemoved(d))
  }

  const handleIfacesChanged = (interfaces: NetworkInterface[]): void => {
    dispatch(networkInterfacesChanged(interfaces))
  }

  app.once('will-quit', () => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (usbMonitor != null) {
      log.debug('stopping usb monitoring')
      usbMonitor.stop()
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
            dispatch(initialized(devices, getActiveInterfaces()))
          })
          .catch((error: Error) =>
            log.warn(`unable to start usb monitor with error: ${error.message}`)
          )
      }
    }
  }
}
