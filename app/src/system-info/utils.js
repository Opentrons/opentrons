// @flow
// system-info helpers and utilities

import { NOT_APPLICABLE, UNKNOWN, UP_TO_DATE, OUTDATED } from './constants'

import type { UsbDevice, U2EAnalyticsProps, DriverStatus } from './types'

const RE_REALTEK = /realtek/i

const REALTEK_UP_TO_DATE_VERSION = [10, 38, 117, 2020]

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

export const isRealtekDevice = (device: UsbDevice): boolean => {
  return RE_REALTEK.test(device.manufacturer)
}

export const getDriverStatus = (device: UsbDevice): DriverStatus => {
  const { windowsDriverVersion } = device
  if (typeof windowsDriverVersion === 'undefined') return NOT_APPLICABLE
  if (windowsDriverVersion === null) return UNKNOWN

  const versionParts = windowsDriverVersion.split('.').map(s => Number(s))
  if (!versionParts.every(p => Number.isFinite(p))) return UNKNOWN

  const upToDate = REALTEK_UP_TO_DATE_VERSION.reduce(
    (result, subversion, index, collection) => {
      if (result === null) {
        const target = versionParts[index] ?? 0
        if (target > subversion) return true
        if (target < subversion) return false
        if (index === collection.length - 1) return target >= subversion
      }

      return result
    },
    null
  )

  return upToDate ? UP_TO_DATE : OUTDATED
}
