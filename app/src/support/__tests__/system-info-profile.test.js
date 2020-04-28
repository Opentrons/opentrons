// @flow

import { makeProfileUpdate } from '../profile'

import * as SystemInfo from '../../system-info'
import * as Fixtures from '../../system-info/__fixtures__'

import type { State, Action } from '../../types'
import type { SupportProfileUpdate } from '../types'

type EventSpec = {|
  should: string,
  action: Action,
  expected: SupportProfileUpdate | null,
|}

const MOCK_STATE: State = ({ mockState: true }: any)

const { mockWindowsRealtekDevice, mockRealtekDevice, mockUsbDevice } = Fixtures

const SPECS: Array<EventSpec> = [
  {
    should: 'ignore systemInfo:INITIALIZED without Realtek devices',
    action: SystemInfo.initialized([mockUsbDevice]),
    expected: null,
  },
  {
    should: 'ignores systemInfo:USB_DEVICE_ADDED without Realtek devices',
    action: SystemInfo.usbDeviceAdded(mockUsbDevice),
    expected: null,
  },
  {
    should: 'add Realtek info to super props on systemInfo:INITIALIZED',
    action: SystemInfo.initialized([mockRealtekDevice]),
    expected: {
      'U2E Vendor ID': mockRealtekDevice.vendorId,
      'U2E Product ID': mockRealtekDevice.productId,
      'U2E Serial Number': mockRealtekDevice.serialNumber,
      'U2E Device Name': mockRealtekDevice.deviceName,
      'U2E Manufacturer': mockRealtekDevice.manufacturer,
    },
  },
  {
    should: 'add Realtek info to super props on systemInfo:USB_DEVICE_ADDED',
    action: SystemInfo.usbDeviceAdded(mockRealtekDevice),
    expected: {
      'U2E Vendor ID': mockRealtekDevice.vendorId,
      'U2E Product ID': mockRealtekDevice.productId,
      'U2E Serial Number': mockRealtekDevice.serialNumber,
      'U2E Device Name': mockRealtekDevice.deviceName,
      'U2E Manufacturer': mockRealtekDevice.manufacturer,
    },
  },
  {
    should: 'include Realtek windows driver version on systemInfo:INITIALIZED',
    action: SystemInfo.initialized([mockWindowsRealtekDevice]),
    expected: expect.objectContaining({
      'U2E Windows Driver Version':
        mockWindowsRealtekDevice.windowsDriverVersion,
    }),
  },
  {
    should:
      'include Realtek windows driver version on systemInfo:USB_DEVICE_ADDED',
    action: SystemInfo.usbDeviceAdded(mockWindowsRealtekDevice),
    expected: expect.objectContaining({
      'U2E Windows Driver Version':
        mockWindowsRealtekDevice.windowsDriverVersion,
    }),
  },
]

describe('system-info support profile updates', () => {
  SPECS.forEach(spec => {
    const { should, action, expected } = spec
    it(`should ${should}`, () => {
      return expect(makeProfileUpdate(action, MOCK_STATE)).toEqual(expected)
    })
  })
})
