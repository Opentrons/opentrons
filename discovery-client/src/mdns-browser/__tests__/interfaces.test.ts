import { mockBaseBrowser } from '../__fixtures__'
import { getBrowserInterfaces, compareInterfaces } from '../interfaces'

import type { Socket } from 'dgram'
import type { Browser as BaseBrowser } from 'mdns-js'

const socket = (address: string): Socket =>
  ({ address: () => ({ address, port: 0 }) } as Socket)

describe('interface utilities', () => {
  describe('getting browser interfaces', () => {
    it('should ignore the multicast interface', () => {
      const browser = {
        ...mockBaseBrowser,
        networking: {
          connections: [
            {
              interfaceIndex: 0,
              networkInterface: 'pseudo multicast',
              socket: socket('0.0.0.0'),
            },
          ],
        },
      } as BaseBrowser

      const result = getBrowserInterfaces(browser)
      expect(result).toEqual([])
    })

    it('should get other interfaces', () => {
      const browser = {
        ...mockBaseBrowser,
        networking: {
          connections: [
            {
              interfaceIndex: 0,
              networkInterface: 'en0',
              socket: socket('169.254.1.1'),
            },
            {
              interfaceIndex: 1,
              networkInterface: 'wlan0',
              socket: socket('192.168.1.1'),
            },
            {
              interfaceIndex: 2,
              networkInterface: 'pseudo multicast',
              socket: socket('0.0.0.0'),
            },
          ],
        },
      } as BaseBrowser

      const result = getBrowserInterfaces(browser)
      expect(result).toEqual([
        { name: 'en0', address: '169.254.1.1' },
        { name: 'wlan0', address: '192.168.1.1' },
      ])
    })
  })

  describe('interface comparison', () => {
    it('should know when a browser includes all given interfaces', () => {
      const browserInterfaces = [{ name: 'en0', address: '192.168.1.1' }]
      const systemInterfaces = [{ name: 'en0', address: '192.168.1.1' }]

      const result = compareInterfaces(browserInterfaces, systemInterfaces)

      expect(result).toEqual({
        interfacesMatch: true,
        missing: [],
        extra: [],
      })
    })

    it('should handle several interfaces in the browser', () => {
      const browserInterfaces = [
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'wlan0', address: '10.0.0.1' },
      ]

      const systemInterfaces = [
        { name: 'wlan0', address: '10.0.0.1' },
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
      ]
      const result = compareInterfaces(browserInterfaces, systemInterfaces)

      expect(result).toEqual({
        interfacesMatch: true,
        missing: [],
        extra: [],
      })
    })

    it('should know when interfaces are missing in the browser', () => {
      const browserInterfaces = [
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'wlan0', address: '10.0.0.1' },
      ]

      const systemInterfaces = [
        { name: 'wlan0', address: '10.0.0.1' },
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'en2', address: '192.168.100.1' },
      ]

      const result = compareInterfaces(browserInterfaces, systemInterfaces)

      expect(result).toEqual({
        interfacesMatch: false,
        missing: [{ name: 'en2', address: '192.168.100.1' }],
        extra: [],
      })
    })

    it('should know when the browser has too many interfaces', () => {
      const browserInterfaces = [
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'en2', address: '192.168.100.1' },
        { name: 'wlan0', address: '10.0.0.1' },
      ]

      const systemInterfaces = [
        { name: 'wlan0', address: '10.0.0.1' },
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
      ]

      const result = compareInterfaces(browserInterfaces, systemInterfaces)

      expect(result).toEqual({
        interfacesMatch: false,
        missing: [],
        extra: [{ name: 'en2', address: '192.168.100.1' }],
      })
    })

    it('should know when browser has both too many and not enough interfaces', () => {
      const browserInterfaces = [
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'en2', address: '192.168.100.1' },
        { name: 'wlan0', address: '10.0.0.1' },
      ]

      const systemInterfaces = [
        { name: 'wlan0', address: '10.0.0.1' },
        { name: 'en0', address: '169.254.1.1' },
        { name: 'en1', address: '192.168.1.1' },
        { name: 'en3', address: '192.168.200.1' },
      ]

      const result = compareInterfaces(browserInterfaces, systemInterfaces)

      expect(result).toEqual({
        interfacesMatch: false,
        missing: [{ name: 'en3', address: '192.168.200.1' }],
        extra: [{ name: 'en2', address: '192.168.100.1' }],
      })
    })
  })
})
