// system-info types

import {
  INITIALIZED,
  USB_DEVICE_ADDED,
  USB_DEVICE_REMOVED,
  NETWORK_INTERFACES_CHANGED,
  NOT_APPLICABLE,
  UNKNOWN,
  UP_TO_DATE,
  OUTDATED,
} from './constants'

export interface UsbDevice {
  locationId: number
  vendorId: number
  productId: number
  deviceName: string
  manufacturer: string
  serialNumber: string
  deviceAddress: number
  windowsDriverVersion?: string | null
}

// based on built-in type os$NetIFAddr
export interface NetworkInterface {
  name: string
  address: string
  netmask: string
  family: string
  mac: string
  internal: boolean
  cidr: string | null
  scopeid?: number
}

export type DriverStatus =
  | typeof NOT_APPLICABLE
  | typeof UNKNOWN
  | typeof UP_TO_DATE
  | typeof OUTDATED

export interface U2EAnalyticsProps {
  'U2E Vendor ID': number
  'U2E Product ID': number
  'U2E Serial Number': string
  'U2E Device Name': string
  'U2E Manufacturer': string
  'U2E Windows Driver Version'?: string | null
  [key: string]: string | number | null | undefined
}

// TODO(mc, 2020-04-17): add other system info
export interface SystemInfoState {
  usbDevices: UsbDevice[]
  networkInterfaces: NetworkInterface[]
}

// TODO(mc, 2020-04-17): add other system info
export interface InitializedAction {
  type: typeof INITIALIZED
  payload: {
    usbDevices: UsbDevice[]
    networkInterfaces: NetworkInterface[]
  }
  meta: { shell: true }
}

export interface UsbDeviceAddedAction {
  type: typeof USB_DEVICE_ADDED
  payload: { usbDevice: UsbDevice }
  meta: { shell: true }
}

export interface UsbDeviceRemovedAction {
  type: typeof USB_DEVICE_REMOVED
  payload: { usbDevice: UsbDevice }
  meta: { shell: true }
}

export interface NetworkInterfacesChangedAction {
  type: typeof NETWORK_INTERFACES_CHANGED
  payload: { networkInterfaces: NetworkInterface[] }
}

export type SystemInfoAction =
  | InitializedAction
  | UsbDeviceAddedAction
  | UsbDeviceRemovedAction
  | NetworkInterfacesChangedAction
