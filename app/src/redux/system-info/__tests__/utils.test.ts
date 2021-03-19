// @flow

import { mockUsbDevice, mockRealtekDevice } from '../__fixtures__'
import { isRealtekU2EAdapter, getDriverStatus } from '../utils'

describe('system info utilities', () => {
  describe('isRealtekU2EAdapter', () => {
    it('should return false if device VID is not Realtek (0x0BDA)', () => {
      const device = { ...mockRealtekDevice, vendorId: parseInt('1234', 16) }
      const isAdapter = isRealtekU2EAdapter(device)
      expect(isAdapter).toBe(false)
    })

    // NOTE(mc, 2020-05-20): this is not the expected value for a RTL8150 chip
    // our device reports 8050 for some reason instead of 8150
    // https://devicehunt.com/view/type/usb/vendor/0BDA/device/8150
    it('should return true if device PID is 0x8050', () => {
      const device = { ...mockRealtekDevice, productId: parseInt('8050', 16) }
      const isAdapter = isRealtekU2EAdapter(device)
      expect(isAdapter).toBe(true)
    })

    // just for safety, catch the canonical PIDs, too
    // these are the model numbers listed on Realtek's driver page
    // https://www.realtek.com/en/component/zoo/category/network-interface-controllers-10-100-1000m-gigabit-ethernet-usb-3-0-software
    it('should return true if device PID is 0x815x', () => {
      const devices = [
        { ...mockRealtekDevice, productId: parseInt('8150', 16) },
        { ...mockRealtekDevice, productId: parseInt('8151', 16) },
        { ...mockRealtekDevice, productId: parseInt('8152', 16) },
        { ...mockRealtekDevice, productId: parseInt('8153', 16) },
        { ...mockRealtekDevice, productId: parseInt('8154', 16) },
        { ...mockRealtekDevice, productId: parseInt('8156', 16) },
      ]
      expect(devices.every(isRealtekU2EAdapter)).toBe(true)
    })
  })

  describe('getDriverStatus', () => {
    it('should return NOT_APPLICABLE if device is not Realtek', () => {
      const device = mockUsbDevice
      expect(getDriverStatus(device)).toBe('NOT_APPLICABLE')
    })

    it('should return NOT_APPLICABLE if not windows', () => {
      const device = mockRealtekDevice
      expect(getDriverStatus(device)).toBe('NOT_APPLICABLE')
    })

    it('should show UNKNOWN for unknown version', () => {
      const device = { ...mockRealtekDevice, windowsDriverVersion: null }
      expect(getDriverStatus(device)).toBe('UNKNOWN')
    })

    it('should show UNKNOWN for bad string version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: 'foo.bar.baz',
      }
      expect(getDriverStatus(device)).toBe('UNKNOWN')
    })

    it('should show OUTDATED for major version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '9.38.117.2020',
      }
      expect(getDriverStatus(device)).toBe('OUTDATED')
    })

    it('should show OUTDATED for minor version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.37.117.2020',
      }
      expect(getDriverStatus(device)).toBe('OUTDATED')
    })

    it('should not show OUTDATED for patch version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.116.2020',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should not show OUTDATED for build version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.117.2019',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should show UP_TO_DATE for good version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.117.2020',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should show UP_TO_DATE for greater minor version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.39.0.0',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should show UP_TO_DATE for greater major version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '11.0.0.0',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })
  })
})
