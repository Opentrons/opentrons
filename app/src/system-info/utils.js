// @flow
// system-info helpers and utilities
import type { UsbDevice, U2EAnalyticsProps } from './types'

const RE_REALTEK = /realtek/i

export const deviceToU2EAnalyticsProps = (
  device: UsbDevice
): U2EAnalyticsProps => {
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
}

export const isRealtekDevice = (device: UsbDevice) => {
  return RE_REALTEK.test(device.manufacturer)
}
