// @flow
import { createSelector } from 'reselect'

import type { State } from '../types'
import { IFACE_FAMILY_IPV4, NOT_APPLICABLE } from './constants'
import type {
  DriverStatus,
  U2EAnalyticsProps,
  U2EInterfaceMap,
  UsbDevice,
} from './types'
import { getDriverStatus, isRealtekU2EAdapter } from './utils'

export const getU2EAdapterDevice: (
  state: State
) => UsbDevice | null = createSelector(
  state => state.systemInfo.usbDevices,
  usbDevices => usbDevices.find(isRealtekU2EAdapter) ?? null
)

export const getU2EWindowsDriverStatus: (
  state: State
) => DriverStatus = createSelector(
  getU2EAdapterDevice,
  device => (device !== null ? getDriverStatus(device) : NOT_APPLICABLE)
)

export const getU2EInterfacesMap: (
  state: State
) => U2EInterfaceMap = createSelector(
  state => state.systemInfo.usbDevices,
  state => state.systemInfo.networkInterfaces,
  (usbDevices, networkInterfaces) => {
    const ue2Adapters = usbDevices.filter(isRealtekU2EAdapter)

    return ue2Adapters.reduce((interfacesBySerial, device) => {
      interfacesBySerial[device.serialNumber] = networkInterfaces.filter(
        iface => {
          const expectedSerial = iface.mac
            .split(':')
            .join('')
            .toLowerCase()

          return device.serialNumber.toLowerCase() === expectedSerial
        }
      )
      return interfacesBySerial
    }, {})
  }
)

export const getU2EDeviceAnalyticsProps: (
  state: State
) => U2EAnalyticsProps | null = createSelector(
  getU2EAdapterDevice,
  getU2EInterfacesMap,
  (device, ifacesMap) => {
    if (!device) return null
    const ifaces = ifacesMap[device.serialNumber]
    const ip =
      ifaces.find(iface => iface.family === IFACE_FAMILY_IPV4)?.address ?? null

    const result: U2EAnalyticsProps = {
      'U2E Vendor ID': device.vendorId,
      'U2E Product ID': device.productId,
      'U2E Serial Number': device.serialNumber,
      'U2E Manufacturer': device.manufacturer,
      'U2E Device Name': device.deviceName,
      'U2E IPv4 Address': ip,
    }

    if (device.windowsDriverVersion) {
      result['U2E Windows Driver Version'] = device.windowsDriverVersion
    }

    return result
  }
)
