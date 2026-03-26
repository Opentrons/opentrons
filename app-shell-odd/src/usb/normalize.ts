import { getUsbDevices } from '../usb/devices'

import type { UsbDevice } from '@opentrons/app/src/redux/system-info/types'
import type { AppShellUsbDevice } from './types'

const parseHexId = (value: string | null | undefined): number | null => {
  if (value == null || value === '') return null

  const parsed = Number.parseInt(value, 16)
  return Number.isNaN(parsed) ? null : parsed
}

const normalizeUsbDevice = (device: AppShellUsbDevice): UsbDevice => ({
  identifier: device.id,
  systemIdentifier: device.sysName,
  productName: device.product,
  manufacturerName: device.manufacturer ?? null,
  vendorId: parseHexId(device.vendorId),
  productId: parseHexId(device.productId),
  serialNumber: device.serialNumber ?? null,
  location: device.location,
})

// internal comes last
const compareUsbDevicesByLocation = (a: UsbDevice, b: UsbDevice): number => {
  const aIsInternal = a.location === 'INTERNAL'
  const bIsInternal = b.location === 'INTERNAL'
  if (aIsInternal && !bIsInternal) {
    return 1
  }
  if (!aIsInternal && bIsInternal) {
    return -1
  }

  return 0
}

export const getUsbDevicesNormalized = async (): Promise<UsbDevice[]> => {
  const devices = await getUsbDevices()
  return devices
    .map(device => normalizeUsbDevice(device as AppShellUsbDevice))
    .sort(compareUsbDevicesByLocation)
}
