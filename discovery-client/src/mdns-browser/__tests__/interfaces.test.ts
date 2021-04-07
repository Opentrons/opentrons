import { mockBaseBrowser } from '../__fixtures__'
import { compareInterfaces } from '../interfaces'

import type { Browser as BaseBrowser } from 'mdns-js'

describe('interface utilities', () => {
  it('should know when a browser includes all given interfaces', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [{ interfaceIndex: 0, networkInterface: 'en0' }],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: true,
      missing: [],
      extra: [],
    })
  })

  it('should not complain about the "all interfaces" pseudo-interface', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [
          { interfaceIndex: 0, networkInterface: 'en0' },
          { interfaceIndex: 1, networkInterface: 'pseudo multicast' },
        ],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: true,
      missing: [],
      extra: [],
    })
  })

  it('should handle several interfaces in the browser', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [
          { interfaceIndex: 0, networkInterface: 'en0' },
          { interfaceIndex: 1, networkInterface: 'en1' },
          { interfaceIndex: 2, networkInterface: 'en2' },
          { interfaceIndex: 3, networkInterface: 'wlan0' },
          { interfaceIndex: 4, networkInterface: 'pseudo multicast' },
        ],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0', 'en1', 'en2', 'wlan0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: true,
      missing: [],
      extra: [],
    })
  })

  it('should know when interfaces are missing in the browser', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [
          { interfaceIndex: 0, networkInterface: 'en0' },
          { interfaceIndex: 1, networkInterface: 'en1' },
          { interfaceIndex: 2, networkInterface: 'en2' },
          { interfaceIndex: 3, networkInterface: 'wlan0' },
          { interfaceIndex: 4, networkInterface: 'pseudo multicast' },
        ],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0', 'en1', 'en2', 'en3', 'wlan0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: false,
      missing: ['en3'],
      extra: [],
    })
  })

  it('should know when the browser has too many interfaces', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [
          { interfaceIndex: 0, networkInterface: 'en0' },
          { interfaceIndex: 1, networkInterface: 'en1' },
          { interfaceIndex: 2, networkInterface: 'en2' },
          { interfaceIndex: 3, networkInterface: 'wlan0' },
          { interfaceIndex: 4, networkInterface: 'pseudo multicast' },
        ],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0', 'en1', 'wlan0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: false,
      missing: [],
      extra: ['en2'],
    })
  })

  it('should know when browser has both too many and not enough interfaces', () => {
    const browser = {
      ...mockBaseBrowser,
      networking: {
        connections: [
          { interfaceIndex: 0, networkInterface: 'en0' },
          { interfaceIndex: 2, networkInterface: 'en2' },
          { interfaceIndex: 3, networkInterface: 'wlan0' },
          { interfaceIndex: 4, networkInterface: 'pseudo multicast' },
        ],
      },
    } as BaseBrowser

    const systemInterfaces = ['en0', 'en1', 'wlan0']

    const result = compareInterfaces(browser, systemInterfaces)

    expect(result).toEqual({
      interfacesMatch: false,
      missing: ['en1'],
      extra: ['en2'],
    })
  })
})
