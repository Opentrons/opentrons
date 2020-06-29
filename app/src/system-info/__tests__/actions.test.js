// @flow
// system-info actions tests

import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { SystemInfoAction } from '../types'

type ActionSpec = {|
  should: string,
  creator: (...args: Array<any>) => SystemInfoAction,
  args: Array<any>,
  expected: SystemInfoAction,
|}

const SPECS: Array<ActionSpec> = [
  {
    should: 'create a systemInfo:USB_DEVICE_ADDED action',
    creator: Actions.usbDeviceAdded,
    args: [Fixtures.mockUsbDevice],
    expected: {
      type: 'systemInfo:USB_DEVICE_ADDED',
      payload: { usbDevice: Fixtures.mockUsbDevice },
    },
  },
  {
    should: 'create a systemInfo:USB_DEVICE_REMOVED action',
    creator: Actions.usbDeviceRemoved,
    args: [Fixtures.mockUsbDevice],
    expected: {
      type: 'systemInfo:USB_DEVICE_REMOVED',
      payload: { usbDevice: Fixtures.mockUsbDevice },
    },
  },
  {
    should: 'create a systemInfo:INITIALIZED action',
    creator: Actions.initialized,
    args: [
      [Fixtures.mockUsbDevice, Fixtures.mockUsbDevice, Fixtures.mockUsbDevice],
      [Fixtures.mockNetworkInterface],
    ],
    expected: {
      type: 'systemInfo:INITIALIZED',
      payload: {
        usbDevices: [
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
        ],
        networkInterfaces: [Fixtures.mockNetworkInterface],
      },
    },
  },
  {
    should: 'create a systemInfo:NETWORK_INTERFACES_CHANGED action',
    creator: Actions.networkInterfacesChanged,
    args: [[Fixtures.mockNetworkInterface]],
    expected: {
      type: 'systemInfo:NETWORK_INTERFACES_CHANGED',
      payload: {
        networkInterfaces: [Fixtures.mockNetworkInterface],
      },
    },
  },
]

describe('system-info actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(`should ${should}`, () => expect(creator(...args)).toEqual(expected))
  })
})
