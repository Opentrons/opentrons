import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import * as Utils from '../utils'
import * as Constants from '../constants'

import type { State } from '../../types'

describe('robot controls selectors', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return null by default with getU2EAdapterDevice', () => {
    const state: State = {
      systemInfo: { usbDevices: [], networkInterfaces: [] },
    } as any

    expect(Selectors.getU2EAdapterDevice(state)).toBe(null)
  })

  it('should return a Realtek device with getU2EAdapterDevice', () => {
    const state: State = {
      systemInfo: {
        usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
        networkInterfaces: [],
      },
    } as any

    expect(Selectors.getU2EAdapterDevice(state)).toBe(
      Fixtures.mockRealtekDevice
    )
  })

  describe('getU2EWindowsDriverStatus', () => {
    it('should return NOT_APPLICABLE if no Windows Realtek devices', () => {
      const state: State = {
        systemInfo: {
          usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
          networkInterfaces: [],
        },
      } as any

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

      const state: State = {
        systemInfo: {
          usbDevices: [
            Fixtures.mockUsbDevice,
            Fixtures.mockWindowsRealtekDevice,
          ],
          networkInterfaces: [],
        },
      } as any

      expect(Selectors.getU2EWindowsDriverStatus(state)).toBe(
        Constants.OUTDATED
      )
    })
  })

  describe('getU2EDeviceAnalyticsProps', () => {
    it('should return null if no Realtek device', () => {
      const state: State = {
        systemInfo: {
          usbDevices: [Fixtures.mockUsbDevice],
          networkInterfaces: [],
        },
      } as any

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toBe(null)
    })

    it('should return device props if Realtek device', () => {
      const state: State = {
        systemInfo: {
          usbDevices: [Fixtures.mockRealtekDevice],
          networkInterfaces: [],
        },
      } as any

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toEqual({
        'U2E Vendor ID': Fixtures.mockRealtekDevice.vendorId,
        'U2E Product ID': Fixtures.mockRealtekDevice.productId,
        'U2E Serial Number': Fixtures.mockRealtekDevice.serialNumber,
        'U2E Device Name': Fixtures.mockRealtekDevice.productName,
        'U2E Manufacturer': Fixtures.mockRealtekDevice.manufacturerName,
      })
    })

    it('should include Windows driver version if applicable', () => {
      const state: State = {
        systemInfo: {
          usbDevices: [Fixtures.mockWindowsRealtekDevice],
          networkInterfaces: [],
        },
      } as any

      expect(Selectors.getU2EDeviceAnalyticsProps(state)).toMatchObject({
        'U2E Windows Driver Version':
          Fixtures.mockWindowsRealtekDevice.windowsDriverVersion,
      })
    })
  })
})
