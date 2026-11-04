import noop from 'lodash/noop'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNetworkInterfaceMonitor,
  getActiveInterfaces,
} from '../network-interfaces'

import type * as os from 'os'

type OsModulePartialForMock = Record<string, unknown> & {
  default?: Record<string, unknown>
}

function assertOsModulePartialForMock(
  value: unknown
): asserts value is OsModulePartialForMock {
  if (typeof value !== 'object' || value === null) {
    throw new Error('importOriginal(os) expected an object')
  }
}

const { networkInterfacesMock } = vi.hoisted(() => ({
  networkInterfacesMock: vi.fn(),
}))

vi.mock('os', async importOriginal => {
  const actual = await importOriginal()
  assertOsModulePartialForMock(actual)
  const previousDefault: Record<string, unknown> = actual.default ?? {}
  return {
    ...actual,
    networkInterfaces: networkInterfacesMock,
    default: {
      ...previousDefault,
      networkInterfaces: networkInterfacesMock,
    },
  }
})

const mockV4: os.NetworkInterfaceInfoIPv4 = {
  address: '192.168.1.17',
  netmask: '255.255.255.0',
  family: 'IPv4',
  mac: 'f8:ff:c2:46:59:80',
  internal: false,
  cidr: '192.168.1.17/24',
}

const mockV6: os.NetworkInterfaceInfoIPv6 = {
  address: 'fe80::8e0:61a3:8bde:7385',
  netmask: 'ffff:ffff:ffff:ffff::',
  family: 'IPv6',
  mac: 'f8:ff:c2:46:59:80',
  internal: false,
  cidr: 'fe80::8e0:61a3:8bde:7385/64',
  scopeid: 6,
}

describe('system-info::network-interfaces', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should return external network interfaces', () => {
    networkInterfacesMock.mockReturnValue({
      en0: [mockV4, mockV6],
      en1: [mockV6],
      lo0: [
        { ...mockV4, internal: true },
        { ...mockV6, internal: true },
      ],
    })

    expect(getActiveInterfaces()).toEqual([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
      { name: 'en1', ...mockV6 },
    ])
  })

  it('should be able to poll the attached network interfaces', () => {
    networkInterfacesMock.mockReturnValue({})

    const monitor = createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: noop,
    })

    expect(networkInterfacesMock).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(30000)
    expect(networkInterfacesMock).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(30000)
    expect(networkInterfacesMock).toHaveBeenCalledTimes(3)

    monitor.stop()
    vi.advanceTimersByTime(30000)
    expect(networkInterfacesMock).toHaveBeenCalledTimes(3)
  })

  it('should be able to signal interface changes', () => {
    const handleInterfaceChange = vi.fn()

    networkInterfacesMock.mockReturnValue({})

    createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: handleInterfaceChange,
    })

    networkInterfacesMock.mockReturnValueOnce({
      en0: [mockV4, mockV6],
    })
    vi.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledWith([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
    ])
    handleInterfaceChange.mockClear()

    networkInterfacesMock.mockReturnValueOnce({
      en0: [mockV4, mockV6],
    })
    vi.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledTimes(0)
    handleInterfaceChange.mockClear()

    networkInterfacesMock.mockReturnValueOnce({
      en0: [mockV4, mockV6],
      en1: [mockV4],
    })
    vi.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledWith([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
      { name: 'en1', ...mockV4 },
    ])
    handleInterfaceChange.mockClear()
  })

  it('should be able to stop monitoring interface changes', () => {
    const handleInterfaceChange = vi.fn()

    networkInterfacesMock.mockReturnValue({})

    const monitor = createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: handleInterfaceChange,
    })

    networkInterfacesMock.mockReturnValueOnce({ en0: [mockV4] })
    monitor.stop()
    vi.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledTimes(0)
  })
})
