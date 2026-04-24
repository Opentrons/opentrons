import { createSelector } from 'reselect'

import { NOT_APPLICABLE } from './constants'
import {
  compareUsbDevicesByLocation,
  getDriverStatus,
  isRealtekU2EAdapter,
} from './utils'

import type { State } from '../types'
import type {
  DriverStatus,
  U2EAnalyticsProps,
  UsbDevice,
  UsbDeviceDisplayRow,
} from './types'

export const getUsbDevices = (state: State): UsbDevice[] =>
  state.systemInfo.usbDevices

export const getU2EAdapterDevice: (state: State) => UsbDevice | null =
  createSelector(
    getUsbDevices,
    usbDevices => usbDevices.find(isRealtekU2EAdapter) ?? null
  )

export const getU2EWindowsDriverStatus: (state: State) => DriverStatus =
  createSelector(getU2EAdapterDevice, device =>
    device !== null ? getDriverStatus(device) : NOT_APPLICABLE
  )

export const getU2EDeviceAnalyticsProps: (
  state: State
) => U2EAnalyticsProps | null = createSelector(getU2EAdapterDevice, device => {
  if (!device) return null
  if (device.vendorId == null || device.productId == null) return null

  const result: U2EAnalyticsProps = {
    'U2E Vendor ID': device.vendorId,
    'U2E Product ID': device.productId,
    'U2E Serial Number': device.serialNumber ?? undefined,
    'U2E Manufacturer': device.manufacturerName ?? undefined,
    'U2E Device Name': device.productName ?? undefined,
  }

  if (device.windowsDriverVersion) {
    result['U2E Windows Driver Version'] = device.windowsDriverVersion
  }

  return result
})

export const getUsbDeviceDisplayRows: (state: State) => UsbDeviceDisplayRow[] =
  createSelector(getUsbDevices, usbDevices =>
    [...usbDevices].sort(compareUsbDevicesByLocation).map(device => {
      const manufacturer = device.manufacturerName?.trim()
      const product = device.productName?.trim()
      const normalizedManufacturer = manufacturer?.toLowerCase()
      const normalizedProduct = product?.toLowerCase()
      const shouldPrefixManufacturer =
        manufacturer != null &&
        manufacturer !== '' &&
        product != null &&
        product !== '' &&
        normalizedProduct != null &&
        normalizedManufacturer != null &&
        !normalizedProduct.includes(normalizedManufacturer)

      const name = shouldPrefixManufacturer
        ? `${manufacturer} ${product}`
        : (product ?? manufacturer ?? device.identifier)

      return {
        id: device.identifier,
        device: name,
        location: device.location ?? '',
      }
    })
  )
