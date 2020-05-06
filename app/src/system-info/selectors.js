// @flow
import { createSelector } from 'reselect'
import { isRealtekDevice, getDriverStatus } from './utils'
import { NOT_APPLICABLE } from './constants'

import type { State } from '../types'
import type { UsbDevice, DriverStatus } from './types'

export const getU2EAdapterDevice: (
  state: State
) => UsbDevice | null = createSelector(
  state => state.systemInfo.usbDevices,
  usbDevices => usbDevices.find(isRealtekDevice) ?? null
)

export const getU2EWindowsDriverStatus: (
  state: State
) => DriverStatus = createSelector(
  getU2EAdapterDevice,
  device => (device !== null ? getDriverStatus(device) : NOT_APPLICABLE)
)
