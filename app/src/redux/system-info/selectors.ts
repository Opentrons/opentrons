import type { State } from '../types'
import { NOT_APPLICABLE } from './constants'
import type { UsbDevice, DriverStatus, U2EAnalyticsProps } from './types'
import { isRealtekU2EAdapter, getDriverStatus } from './utils'
import { createSelector } from 'reselect'

export const getU2EAdapterDevice: (
  state: State
) => UsbDevice | null = createSelector(
  state => state.systemInfo.usbDevices,
  usbDevices => usbDevices.find(isRealtekU2EAdapter) ?? null
)

export const getU2EWindowsDriverStatus: (
  state: State
) => DriverStatus = createSelector(getU2EAdapterDevice, device =>
  device !== null ? getDriverStatus(device) : NOT_APPLICABLE
)

export const getU2EDeviceAnalyticsProps: (
  state: State
) => U2EAnalyticsProps | null = createSelector(getU2EAdapterDevice, device => {
  if (!device) return null

  const result: U2EAnalyticsProps = {
    'U2E Vendor ID': device.vendorId,
    'U2E Product ID': device.productId,
    'U2E Serial Number': device.serialNumber,
    'U2E Manufacturer': device.manufacturer,
    'U2E Device Name': device.deviceName,
  }

  if (device.windowsDriverVersion) {
    result['U2E Windows Driver Version'] = device.windowsDriverVersion
  }

  return result
})
