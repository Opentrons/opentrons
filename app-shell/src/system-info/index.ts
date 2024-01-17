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
const createUsbDevice = (device: USBDevice): UsbDevice => {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    deviceName: device.productName != null ? device.productName : 'no name',
    manufacturer:
      device.manufacturerName != null
        ? device.manufacturerName
        : 'no manufacture',
    serialNumber:
      device.serialNumber != null ? device.serialNumber : 'no serial',
  }
}
const createUsbDevices = (devices: USBDevice[]): UsbDevice[] =>
  devices.map((device: USBDevice) => createUsbDevice(device))

const addDriverVersion = (device: UsbDevice): Promise<UsbDevice> => {
  if (
    isWindows() &&
    device.manufacturer != null &&
    RE_REALTEK.test(device.manufacturer)
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
    addDriverVersion(device).then(d => dispatch(SystemInfo.usbDeviceAdded(d)))
  }

  const handleDeviceRemove = (d: UsbDevice): void => {
    dispatch(SystemInfo.usbDeviceRemoved(d))
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
          .then(devices =>
            Promise.all(createUsbDevices(devices).map(addDriverVersion))
          )
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
