// @flow

import * as SystemInfo from '../../system-info'
import * as Fixtures from '../../system-info/__fixtures__'
import type { U2EAnalyticsProps } from '../../system-info/types'
import type { State } from '../../types'
import { makeProfileUpdate } from '../profile'

jest.mock('../../system-info/selectors')

const getU2EDeviceAnalyticsProps: JestMockFn<
  [State],
  U2EAnalyticsProps | null
> = SystemInfo.getU2EDeviceAnalyticsProps

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_ANALYTICS_PROPS = {
  'U2E Vendor ID': Fixtures.mockRealtekDevice.vendorId,
  'U2E Product ID': Fixtures.mockRealtekDevice.productId,
  'U2E Serial Number': Fixtures.mockRealtekDevice.serialNumber,
  'U2E Manufacturer': Fixtures.mockRealtekDevice.manufacturer,
  'U2E Device Name': Fixtures.mockRealtekDevice.deviceName,
  'U2E IPv4 Address': '10.0.0.1',
}

describe('custom labware analytics events', () => {
  beforeEach(() => {
    getU2EDeviceAnalyticsProps.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return MOCK_ANALYTICS_PROPS
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should trigger an event on systemInfo:INITIALIZED', () => {
    const action = SystemInfo.initialized([Fixtures.mockRealtekDevice], [])
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(MOCK_ANALYTICS_PROPS)
  })

  it('should trigger an event on systemInfo:USB_DEVICE_ADDED', () => {
    const action = SystemInfo.usbDeviceAdded(Fixtures.mockRealtekDevice)
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(MOCK_ANALYTICS_PROPS)
  })

  it('should trigger an event on systemInfo:NETWORK_INTERFACES_CHANGED', () => {
    const action = SystemInfo.networkInterfacesChanged([
      Fixtures.mockNetworkInterface,
    ])
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(MOCK_ANALYTICS_PROPS)
  })

  it('should not trigger on systemInfo:INITIALIZED if selector returns null', () => {
    getU2EDeviceAnalyticsProps.mockReturnValue(null)

    const action = SystemInfo.initialized([Fixtures.mockRealtekDevice], [])
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(null)
  })

  it('should not trigger on systemInfo:USB_DEVICE_ADDED if selector returns null', () => {
    getU2EDeviceAnalyticsProps.mockReturnValue(null)

    const action = SystemInfo.usbDeviceAdded(Fixtures.mockRealtekDevice)
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(null)
  })

  it('should not trigger on systemInfo:NETWORK_INTERFACES_CHANGED if selector returns null', () => {
    getU2EDeviceAnalyticsProps.mockReturnValue(null)

    const action = SystemInfo.networkInterfacesChanged([
      Fixtures.mockNetworkInterface,
    ])
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toEqual(null)
  })
})
