// @flow
// system-info types

import typeof {
  INITIALIZED,
  NETWORK_INTERFACES_CHANGED,
  NOT_APPLICABLE,
  OUTDATED,
  UNKNOWN,
  UP_TO_DATE,
  USB_DEVICE_ADDED,
  USB_DEVICE_REMOVED,
} from './constants'

export type UsbDevice = {|
  locationId: number,
  vendorId: number,
  productId: number,
  deviceName: string,
  manufacturer: string,
  serialNumber: string,
  deviceAddress: number,
  windowsDriverVersion?: string | null,
|}

// based on built-in type os$NetIFAddr
export type NetworkInterface = {|
  name: string,
  address: string,
  netmask: string,
  family: string,
  mac: string,
  internal: boolean,
  cidr: string,
  scopeid?: number,
|}

export type U2EInterfaceMap = {
  [deviceSerialNumber: string]: Array<NetworkInterface>,
  ...,
}

export type DriverStatus = NOT_APPLICABLE | UNKNOWN | UP_TO_DATE | OUTDATED

export type U2EAnalyticsProps = {|
  'U2E Vendor ID': number,
  'U2E Product ID': number,
  'U2E Serial Number': string,
  'U2E Device Name': string,
  'U2E Manufacturer': string,
  'U2E IPv4 Address': string | null,
  'U2E Windows Driver Version'?: string | null,
|}

// TODO(mc, 2020-04-17): add other system info
export type SystemInfoState = {|
  usbDevices: Array<UsbDevice>,
  networkInterfaces: Array<NetworkInterface>,
|}

// TODO(mc, 2020-04-17): add other system info
export type InitializedAction = {|
  type: INITIALIZED,
  payload: {|
    usbDevices: Array<UsbDevice>,
    networkInterfaces: Array<NetworkInterface>,
  |},
|}

export type UsbDeviceAddedAction = {|
  type: USB_DEVICE_ADDED,
  payload: {| usbDevice: UsbDevice |},
|}

export type UsbDeviceRemovedAction = {|
  type: USB_DEVICE_REMOVED,
  payload: {| usbDevice: UsbDevice |},
|}

export type NetworkInterfacesChangedAction = {|
  type: NETWORK_INTERFACES_CHANGED,
  payload: {| networkInterfaces: Array<NetworkInterface> |},
|}

export type SystemInfoAction =
  | InitializedAction
  | UsbDeviceAddedAction
  | UsbDeviceRemovedAction
  | NetworkInterfacesChangedAction
