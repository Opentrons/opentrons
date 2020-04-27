// @flow
// system-info reducer tests

import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import { systemInfoReducer } from '../reducer'

import type { Action } from '../../types'
import type { SystemInfoState } from '../types'

type ReducerSpec = {|
  should: string,
  action: Action,
  initialState: SystemInfoState,
  expectedState: SystemInfoState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    should: 'handle systemInfo:INITIALIZED action',
    action: Actions.initialized([Fixtures.mockUsbDevice]),
    initialState: { usbDevices: [] },
    expectedState: { usbDevices: [Fixtures.mockUsbDevice] },
  },
  {
    should: 'add single device with systemInfo:USB_DEVICE_ADDED',
    action: Actions.usbDeviceAdded(Fixtures.mockUsbDevice),
    initialState: { usbDevices: [] },
    expectedState: { usbDevices: [Fixtures.mockUsbDevice] },
  },
  {
    should: 'remove device with systemInfo:USB_DEVICE_REMOVED',
    action: Actions.usbDeviceRemoved(Fixtures.mockUsbDevice),
    initialState: { usbDevices: [Fixtures.mockUsbDevice] },
    expectedState: { usbDevices: [] },
  },
]

describe('system-info reducer', () => {
  SPECS.forEach(({ should, action, initialState, expectedState }) => {
    it(`should ${should}`, () => {
      const nextState = systemInfoReducer(initialState, action)
      expect(nextState).not.toBe(initialState)
      expect(nextState).toEqual(expectedState)
    })
  })
})
