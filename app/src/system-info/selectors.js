// @flow
import { createSelector } from 'reselect'
import { isRealtekDevice } from './utils'

import type { State } from '../types'
import type { UsbDevice } from './types'

export const getU2EAdapterDevice: (
  state: State
) => UsbDevice | null = createSelector(
  state => state.systemInfo.usbDevices,
  usbDevices => usbDevices.find(isRealtekDevice) ?? null
)
