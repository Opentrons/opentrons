// @flow
// system-info reducer tests

import * as Fixtures from '../__fixtures__'
import type { Action } from '../../types'
import * as Actions from '../actions'
import { systemInfoReducer } from '../reducer'
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
    action: Actions.initialized(
      [Fixtures.mockUsbDevice],
      [Fixtures.mockNetworkInterface]
    ),
    initialState: { usbDevices: [], networkInterfaces: [] },
    expectedState: {
      usbDevices: [Fixtures.mockUsbDevice],
      networkInterfaces: [Fixtures.mockNetworkInterface],
    },
  },
  {
    should: 'add single device with systemInfo:USB_DEVICE_ADDED',
    action: Actions.usbDeviceAdded(Fixtures.mockUsbDevice),
    initialState: { usbDevices: [], networkInterfaces: [] },
    expectedState: {
      usbDevices: [Fixtures.mockUsbDevice],
      networkInterfaces: [],
    },
  },
  {
    should: 'remove device with systemInfo:USB_DEVICE_REMOVED',
    action: Actions.usbDeviceRemoved(Fixtures.mockUsbDevice),
    initialState: {
      usbDevices: [Fixtures.mockUsbDevice],
      networkInterfaces: [],
    },
    expectedState: { usbDevices: [], networkInterfaces: [] },
  },
  {
    should: 'handle systemInfo:NETWORK_INTERFACES_CHANGED action',
    action: Actions.networkInterfacesChanged([Fixtures.mockNetworkInterface]),
    initialState: { usbDevices: [], networkInterfaces: [] },
    expectedState: {
      usbDevices: [],
      networkInterfaces: [Fixtures.mockNetworkInterface],
    },
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
