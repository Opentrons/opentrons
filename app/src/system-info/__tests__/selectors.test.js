// @flow

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
    const state: State = ({ systemInfo: { usbDevices: [] } }: $Shape<State>)

    expect(Selectors.getU2EAdapterDevice(state)).toBe(null)
  })

  it('should return a Realtek device with getU2EAdapterDevice', () => {
    const state: State = ({
      systemInfo: {
        usbDevices: [Fixtures.mockUsbDevice, Fixtures.mockRealtekDevice],
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
        },
      }: $Shape<State>)

      expect(Selectors.getU2EWindowsDriverStatus(state)).toBe(
        Constants.OUTDATED
      )
    })
  })
})
