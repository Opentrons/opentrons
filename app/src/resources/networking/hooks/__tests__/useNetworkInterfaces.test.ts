import { describe, expect, it } from 'vitest'

import * as Fixtures from '/app/redux/networking/__fixtures__'

import { getInterfaceStatusByType } from '../useNetworkInterfaces'

describe('getInterfaceStatusByType', () => {
  it('returns null interfaces when unavailable', () => {
    expect(getInterfaceStatusByType(null)).toEqual({
      wifi: null,
      ethernet: null,
    })
    expect(getInterfaceStatusByType(undefined)).toEqual({
      wifi: null,
      ethernet: null,
    })
  })

  it('parses IP and subnet mask from interface status', () => {
    expect(
      getInterfaceStatusByType({
        wlan0: Fixtures.mockWifiInterface,
        eth0: Fixtures.mockEthernetInterface,
      })
    ).toEqual({
      wifi: {
        ipAddress: '192.168.43.97',
        subnetMask: '255.255.255.0',
        macAddress: Fixtures.mockWifiInterface.macAddress,
        type: Fixtures.mockWifiInterface.type,
      },
      ethernet: {
        ipAddress: '169.254.229.173',
        subnetMask: '255.255.0.0',
        macAddress: Fixtures.mockEthernetInterface.macAddress,
        type: Fixtures.mockEthernetInterface.type,
      },
    })
  })

  it('returns null IP and subnet when interface has no IP', () => {
    expect(
      getInterfaceStatusByType({
        eth0: {
          ...Fixtures.mockEthernetInterface,
          ipAddress: null,
        },
      })
    ).toEqual({
      wifi: null,
      ethernet: {
        ipAddress: null,
        subnetMask: null,
        macAddress: Fixtures.mockEthernetInterface.macAddress,
        type: Fixtures.mockEthernetInterface.type,
      },
    })
  })

  it('returns null subnet when mask is not parsable from IP', () => {
    expect(
      getInterfaceStatusByType({
        wlan0: {
          ...Fixtures.mockWifiInterface,
          ipAddress: '192.168.1.1',
        },
      })
    ).toEqual({
      ethernet: null,
      wifi: {
        ipAddress: '192.168.1.1',
        subnetMask: null,
        macAddress: Fixtures.mockWifiInterface.macAddress,
        type: Fixtures.mockWifiInterface.type,
      },
    })
  })
})
