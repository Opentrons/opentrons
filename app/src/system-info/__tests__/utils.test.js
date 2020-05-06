// @flow

import { mockUsbDevice, mockRealtekDevice } from '../__fixtures__'
import { getDriverStatus } from '../utils'

describe('system info utilities', () => {
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

    it('should show OUTDATED for patch version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.116.2020',
      }
      expect(getDriverStatus(device)).toBe('OUTDATED')
    })

    it('should show OUTDATED for build version difference', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.117.2019',
      }
      expect(getDriverStatus(device)).toBe('OUTDATED')
    })

    it('should show UP_TO_DATE for good version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.117.2020',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should show UP_TO_DATE for greater build version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.117.2021',
      }
      expect(getDriverStatus(device)).toBe('UP_TO_DATE')
    })

    it('should show UP_TO_DATE for greater patch version', () => {
      const device = {
        ...mockRealtekDevice,
        windowsDriverVersion: '10.38.118.0',
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
