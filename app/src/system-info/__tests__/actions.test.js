// @flow
// system-info actions tests

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'
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
    // TODO(mc, 2020-04-17): add other system info
    should: 'create a systemInfo:INITIALIZED action',
    creator: Actions.initialized,
    args: [
      [Fixtures.mockUsbDevice, Fixtures.mockUsbDevice, Fixtures.mockUsbDevice],
    ],
    expected: {
      type: 'systemInfo:INITIALIZED',
      payload: {
        usbDevices: [
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
        ],
      },
    },
  },
]

describe('system-info actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(`should ${should}`, () => expect(creator(...args)).toEqual(expected))
  })
})
