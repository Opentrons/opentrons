// @flow
// system-info helpers and utilities

import { NOT_APPLICABLE, UNKNOWN, UP_TO_DATE, OUTDATED } from './constants'

import type { UsbDevice, U2EAnalyticsProps, DriverStatus } from './types'

// Driver version 10.38.117.2020, latest for Windows 10 as of 2020-04-12
// NOTE(mc, 2020-05-05): this will cause false alerts on Windows 7; Realtek's
// versioning scheme seems to be WindowsVersion.Something.Something.Year
// TODO(mc, 2020-05-06): move to config once migrations are addressed
// https://github.com/Opentrons/opentrons/issues/5587
const REALTEK_UP_TO_DATE_VERSION = [10, 38, 117, 2020]

// Our U2E adapter should have the following properties:
// Vendor ID: 0x0BDA, Product ID: 0x8150
// NOTE(mc, 2020-05-20): our device erroneously reports a PID of 0x8050
const REALTEK_VID = parseInt('0BDA', 16)
const RE_REALTEK_PID = /^8[0|1]5[0-9]$/

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

export const isRealtekU2EAdapter = (device: UsbDevice): boolean => {
  return (
    device.vendorId === REALTEK_VID &&
    RE_REALTEK_PID.test(device.productId.toString(16))
  )
}

export const getDriverStatus = (device: UsbDevice): DriverStatus => {
  const { windowsDriverVersion } = device
  if (
    !isRealtekU2EAdapter(device) ||
    typeof windowsDriverVersion === 'undefined'
  ) {
    return NOT_APPLICABLE
  }

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
