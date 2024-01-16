// system info module
import { app } from 'electron'
import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import * as SystemInfo from '@opentrons/app/src/redux/system-info'
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

export { createNetworkInterfaceMonitor }
export type { NetworkInterface, NetworkInterfaceMonitor }

const RE_REALTEK = /realtek/i
const IFACE_POLL_INTERVAL_MS = 30000

const log = createLogger('system-info')

// format USBDevice to UsbDevice type
const createUsbDevice = (
  device: USBDevice,
  windowsDriverVersion?: string | null
): UsbDevice => ({
  vendorId: device.vendorId,
  productId: device.productId,
  deviceName: device.productName != null ? device.productName : 'no name',
  manufacturer:
    device.manufacturerName != null
      ? device.manufacturerName
      : 'no manufacture',
  serialNumber: device.serialNumber != null ? device.serialNumber : 'no serial',
  windowsDriverVersion,
})

const addDriverVersion = (device: USBDevice): Promise<UsbDevice> => {
  if (
    isWindows() &&
    device.manufacturerName != null &&
    RE_REALTEK.test(device.manufacturerName)
  ) {
    return getWindowsDriverVersion(device).then(windowsDriverVersion =>
      createUsbDevice(device, windowsDriverVersion)
    )
  }

  return Promise.resolve(createUsbDevice(device))
}

export function registerSystemInfo(
  dispatch: Dispatch
): (action: Action) => void {
  let usbMonitor: UsbDeviceMonitor
  let ifaceMonitor: NetworkInterfaceMonitor

  const handleDeviceAdd = (device: USBDevice): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    addDriverVersion(device).then(d => dispatch(SystemInfo.usbDeviceAdded(d)))
  }

  const handleDeviceRemove = (d: USBDevice): void => {
    dispatch(SystemInfo.usbDeviceRemoved(createUsbDevice(d)))
  }

  const handleIfacesChanged = (interfaces: NetworkInterface[]): void => {
    dispatch(SystemInfo.networkInterfacesChanged(interfaces))
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
            dispatch(SystemInfo.initialized(devices, getActiveInterfaces()))
          })
          .catch((error: Error) =>
            log.warn(`unable to start usb monitor with error: ${error.message}`)
          )
      }
    }
  }
}
