// @flow

import { makeEvent } from '../make-event'

import * as SystemInfo from '../../system-info'
import * as Fixtures from '../../system-info/__fixtures__'

import type { State, Action } from '../../types'
import type { AnalyticsEvent } from '../types'

type EventSpec = {|
  should: string,
  action: Action,
  expected: AnalyticsEvent | null,
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
      superProperties: {
        'U2E Vendor ID': mockRealtekDevice.vendorId,
        'U2E Product ID': mockRealtekDevice.productId,
        'U2E Serial Number': mockRealtekDevice.serialNumber,
        'U2E Device Name': mockRealtekDevice.deviceName,
        'U2E Manufacturer': mockRealtekDevice.manufacturer,
      },
    },
  },
  {
    should: 'add Realtek info to super props on systemInfo:USB_DEVICE_ADDED',
    action: SystemInfo.usbDeviceAdded(mockRealtekDevice),
    expected: {
      superProperties: {
        'U2E Vendor ID': mockRealtekDevice.vendorId,
        'U2E Product ID': mockRealtekDevice.productId,
        'U2E Serial Number': mockRealtekDevice.serialNumber,
        'U2E Device Name': mockRealtekDevice.deviceName,
        'U2E Manufacturer': mockRealtekDevice.manufacturer,
      },
    },
  },
  {
    should: 'include Realtek windows driver version on systemInfo:INITIALIZED',
    action: SystemInfo.initialized([mockWindowsRealtekDevice]),
    expected: {
      superProperties: expect.objectContaining({
        'U2E Windows Driver Version':
          mockWindowsRealtekDevice.windowsDriverVersion,
      }),
    },
  },
  {
    should:
      'include Realtek windows driver version on systemInfo:USB_DEVICE_ADDED',
    action: SystemInfo.usbDeviceAdded(mockWindowsRealtekDevice),
    expected: {
      superProperties: expect.objectContaining({
        'U2E Windows Driver Version':
          mockWindowsRealtekDevice.windowsDriverVersion,
      }),
    },
  },
]

describe('custom labware analytics events', () => {
  SPECS.forEach(spec => {
    const { should, action, expected } = spec
    it(`should ${should}`, () => {
      return expect(makeEvent(action, MOCK_STATE)).resolves.toEqual(expected)
    })
  })
})
