// @flow
import os from 'os'
import noop from 'lodash/noop'

import {
  getActiveInterfaces,
  createNetworkInterfaceMonitor,
} from '../network-interfaces'

jest.mock('os')

const networkInterfaces: JestMockFn<
  [],
  { [ifName: string]: Array<os$NetIFAddr>, ... }
> = os.networkInterfaces

const mockV4 = {
  address: '192.168.1.17',
  netmask: '255.255.255.0',
  family: 'IPv4',
  mac: 'f8:ff:c2:46:59:80',
  internal: false,
  cidr: '192.168.1.17/24',
}

const mockV6 = {
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
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should return external network interfaces', () => {
    networkInterfaces.mockReturnValue({
      en0: [mockV4, mockV6],
      en1: [mockV6],
      lo0: [{ ...mockV4, internal: true }, { ...mockV6, internal: true }],
    })

    expect(getActiveInterfaces()).toEqual([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
      { name: 'en1', ...mockV6 },
    ])
  })

  it('should be able to poll the attached network interfaces', () => {
    networkInterfaces.mockReturnValue({})

    const monitor = createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: noop,
    })

    expect(networkInterfaces).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(30000)
    expect(networkInterfaces).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(30000)
    expect(networkInterfaces).toHaveBeenCalledTimes(3)

    monitor.stop()
    jest.advanceTimersByTime(30000)
    expect(networkInterfaces).toHaveBeenCalledTimes(3)
  })

  it('should be able to signal interface changes', () => {
    const handleInterfaceChange = jest.fn()

    networkInterfaces.mockReturnValue({})

    createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: handleInterfaceChange,
    })

    networkInterfaces.mockReturnValueOnce({
      en0: [mockV4, mockV6],
    })
    jest.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledWith([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
    ])
    handleInterfaceChange.mockClear()

    networkInterfaces.mockReturnValueOnce({
      en0: [mockV4, mockV6],
    })
    jest.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledTimes(0)
    handleInterfaceChange.mockClear()

    networkInterfaces.mockReturnValueOnce({
      en0: [mockV4, mockV6],
      en1: [mockV4],
    })
    jest.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledWith([
      { name: 'en0', ...mockV4 },
      { name: 'en0', ...mockV6 },
      { name: 'en1', ...mockV4 },
    ])
    handleInterfaceChange.mockClear()
  })

  it('should be able to stop monitoring interface changes', () => {
    const handleInterfaceChange = jest.fn()

    networkInterfaces.mockReturnValue({})

    const monitor = createNetworkInterfaceMonitor({
      pollInterval: 30000,
      onInterfaceChange: handleInterfaceChange,
    })

    networkInterfaces.mockReturnValueOnce({ en0: [mockV4] })
    monitor.stop()
    jest.advanceTimersByTime(30000)
    expect(handleInterfaceChange).toHaveBeenCalledTimes(0)
  })
})
