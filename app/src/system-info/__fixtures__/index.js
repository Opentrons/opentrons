// @flow
import type { UsbDevice } from '../types'

export const mockUsbDevice: UsbDevice = {
  locationId: 1,
  // 0x0001
  vendorId: 1,
  // 0x000A
  productId: 10,
  deviceName: 'USB Device',
  manufacturer: 'Manufacturer Name',
  serialNumber: 'Serial Number',
  deviceAddress: 5,
}

export const mockRealtekDevice: UsbDevice = {
  locationId: 1,
  // 0x0010
  vendorId: 16,
  // 0x00A0
  productId: 160,
  deviceName: 'USB 10/100 LAN',
  manufacturer: 'Realtek',
  serialNumber: 'Serial Number',
  deviceAddress: 5,
}

export const mockWindowsRealtekDevice: UsbDevice = {
  locationId: 1,
  // 0x0100
  vendorId: 256,
  // 0x0A00
  productId: 2560,
  deviceName: 'Realtek USB FE Family Controller',
  manufacturer: 'Realtek',
  serialNumber: 'Serial Number',
  deviceAddress: 5,
  windowsDriverVersion: '1.2.3',
}
