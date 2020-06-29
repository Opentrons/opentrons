// @flow

import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'
import * as Constants from '../constants'
import * as Selectors from '../selectors'
import * as Utils from '../utils'

describe('robot controls selectors', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return null by default with getU2EAdapterDevice', () => {
    const state: State = ({
      systemInfo: { usbDevices: [], networkInterfaces: [] },
    }: $Shape<State>)

    expect(Selectors.getU2EAdapterDevice(state)).toBe(null)
  })

  it('should return a Realtek device with getU2EAdapterDevice', () => {
    const state: State = ({
      systemInfo: {
        usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
        networkInterfaces: [],
      },
    }: $Shape<State>)

    expect(Selectors.getU2EAdapterDevice(state)).toBe(
      Fixtures.mockRealtekDevice
    )
  })

  describe('getU2EWindowsDriverStatus', () => {
    it('should return NOT_APPLICABLE if no Windows Realtek devices', () => {
      const state: State = ({
        systemInfo: {
          usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
          networkInterfaces: [],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EWindowsDriverStatus(state)).toBe(
        Constants.NOT_APPLICABLE
      )
    })

    it('should return status from utils.getDriverStatus if Windows Realtek device', () => {
      const getDriverStatus = jest.spyOn(Utils, 'getDriverStatus')

      getDriverStatus.mockImplementation(d => {
        return d === Fixtures.mockWindowsRealtekDevice
          ? Constants.OUTDATED
          : Constants.NOT_APPLICABLE
      })

      const state: State = ({
        systemInfo: {
          usbDevices: [
            Fixtures.mockUsbDevice,
            Fixtures.mockWindowsRealtekDevice,
          ],
          networkInterfaces: [],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EWindowsDriverStatus(state)).toBe(
        Constants.OUTDATED
      )
    })
  })

  describe('getU2EInterfacesMap', () => {
    it('should return empty dict by default', () => {
      const state: State = ({
        systemInfo: { usbDevices: [], networkInterfaces: [] },
      }: $Shape<State>)

      expect(Selectors.getU2EInterfacesMap(state)).toEqual({})
    })

    it('should return empty iface array if adapter found but no interface with same MAC', () => {
      const state: State = ({
        systemInfo: {
          usbDevices: [Fixtures.mockRealtekDevice],
          networkInterfaces: [Fixtures.mockNetworkInterface],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EInterfacesMap(state)).toEqual({
        [Fixtures.mockRealtekDevice.serialNumber]: [],
      })
    })

    it('should return interface with matching MAC', () => {
      const mac = ['01', '23', '45', '67', '89', 'AB']
      const adapter = {
        ...Fixtures.mockRealtekDevice,
        serialNumber: mac.join(''),
      }
      const iface = {
        ...Fixtures.mockNetworkInterface,
        mac: mac.join(':').toLowerCase(),
      }

      const state: State = ({
        systemInfo: { usbDevices: [adapter], networkInterfaces: [iface] },
      }: $Shape<State>)

      expect(Selectors.getU2EInterfacesMap(state)).toEqual({
        [adapter.serialNumber]: [iface],
      })
    })

    it('should handle multiple devices and interface with matching MAC', () => {
      const mac1 = ['01', '23', '45', '67', '89', 'AB']
      const mac2 = ['FE', 'DC', 'BA', '98', '76', '54']

      const adapter1 = {
        ...Fixtures.mockRealtekDevice,
        serialNumber: mac1.join(''),
      }
      const adapter2 = {
        ...Fixtures.mockRealtekDevice,
        serialNumber: mac2.join(''),
      }

      const iface1v4 = {
        ...Fixtures.mockNetworkInterface,
        mac: mac1.join(':').toLowerCase(),
      }
      const iface1v6 = {
        ...Fixtures.mockNetworkInterfaceV6,
        mac: mac1.join(':'),
      }
      const iface2v4 = {
        ...Fixtures.mockNetworkInterface,
        mac: mac2.join(':').toLowerCase(),
      }

      const state: State = ({
        systemInfo: {
          usbDevices: [adapter1, adapter2],
          networkInterfaces: [
            Fixtures.mockNetworkInterface,
            iface1v4,
            iface1v6,
            iface2v4,
          ],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EInterfacesMap(state)).toEqual({
        [adapter1.serialNumber]: [iface1v4, iface1v6],
        [adapter2.serialNumber]: [iface2v4],
      })
    })
  })

  describe('getU2EDeviceAnalyticsProps', () => {
    it('should return null if no Realtek device', () => {
      const state: State = ({
        systemInfo: {
          usbDevices: [Fixtures.mockUsbDevice],
          networkInterfaces: [],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toBe(null)
    })

    it('should return device props if Realtek device', () => {
      const state: State = ({
        systemInfo: {
          usbDevices: [Fixtures.mockRealtekDevice],
          networkInterfaces: [],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toEqual({
        'U2E Vendor ID': Fixtures.mockRealtekDevice.vendorId,
        'U2E Product ID': Fixtures.mockRealtekDevice.productId,
        'U2E Serial Number': Fixtures.mockRealtekDevice.serialNumber,
        'U2E Device Name': Fixtures.mockRealtekDevice.deviceName,
        'U2E Manufacturer': Fixtures.mockRealtekDevice.manufacturer,
        'U2E IPv4 Address': null,
      })
    })

    it('should include Windows driver version if applicable', () => {
      const state: State = ({
        systemInfo: {
          usbDevices: [Fixtures.mockWindowsRealtekDevice],
          networkInterfaces: [],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toMatchObject({
        'U2E Windows Driver Version':
          Fixtures.mockWindowsRealtekDevice.windowsDriverVersion,
      })
    })

    it('should include IPv4 address if available', () => {
      const mac = ['01', '23', '45', '67', '89', 'AB']
      const adapter = {
        ...Fixtures.mockRealtekDevice,
        serialNumber: mac.join(''),
      }
      const ifaceV4 = {
        ...Fixtures.mockNetworkInterface,
        mac: mac.join(':').toLowerCase(),
      }
      const ifaceV6 = {
        ...Fixtures.mockNetworkInterfaceV6,
        mac: mac.join(':').toLowerCase(),
      }

      const state: State = ({
        systemInfo: {
          usbDevices: [adapter],
          networkInterfaces: [ifaceV6, ifaceV4],
        },
      }: $Shape<State>)

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toMatchObject({
        'U2E IPv4 Address': ifaceV4.address,
      })
    })
  })
})
