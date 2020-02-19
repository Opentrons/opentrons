// @flow
import * as Selectors from '../selectors'
import * as Constants from '../constants'
import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: ($Shape<State>, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

describe('robot settings selectors', () => {
  const SPECS: Array<SelectorSpec> = [
    {
      name: 'getInternetStatus returns null if unavailable',
      selector: Selectors.getInternetStatus,
      state: { networking: {} },
      args: ['robotName'],
      expected: null,
    },
    {
      name: 'getInternetStatus returns internetStatus from state',
      selector: Selectors.getInternetStatus,
      state: {
        networking: {
          robotName: {
            internetStatus: Constants.STATUS_FULL,
          },
        },
      },
      args: ['robotName'],
      expected: Constants.STATUS_FULL,
    },
    {
      name: 'getNetworkInterfaces returns null if unavailable',
      selector: Selectors.getNetworkInterfaces,
      state: { networking: {} },
      args: ['robotName'],
      expected: { wifi: null, ethernet: null },
    },
    {
      name: 'getNetworkInterfaces returns interface from state',
      selector: Selectors.getNetworkInterfaces,
      state: {
        networking: {
          robotName: {
            interfaces: {
              wlan0: Fixtures.mockWifiInterface,
              eth0: Fixtures.mockEthernetInterface,
            },
          },
        },
      },
      args: ['robotName'],
      expected: {
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
      },
    },
    {
      name: 'getNetworkInterfaces returns null IP and subnet if no IP',
      selector: Selectors.getNetworkInterfaces,
      state: {
        networking: {
          robotName: {
            interfaces: {
              eth0: {
                ...Fixtures.mockEthernetInterface,
                ipAddress: null,
              },
            },
          },
        },
      },
      args: ['robotName'],
      expected: {
        wifi: null,
        ethernet: {
          ipAddress: null,
          subnetMask: null,
          macAddress: Fixtures.mockEthernetInterface.macAddress,
          type: Fixtures.mockEthernetInterface.type,
        },
      },
    },
    {
      name: 'getNetworkInterfaces returns null subnet if not parsable from IP',
      selector: Selectors.getNetworkInterfaces,
      state: {
        networking: {
          robotName: {
            interfaces: {
              wlan0: {
                ...Fixtures.mockWifiInterface,
                ipAddress: '192.168.1.1',
              },
            },
          },
        },
      },
      args: ['robotName'],
      expected: {
        ethernet: null,
        wifi: {
          ipAddress: '192.168.1.1',
          subnetMask: null,
          macAddress: Fixtures.mockWifiInterface.macAddress,
          type: Fixtures.mockWifiInterface.type,
        },
      },
    },
    {
      name: 'getWifiList returns [] if unavailable',
      selector: Selectors.getWifiList,
      state: {
        networking: {},
      },
      args: ['robotName'],
      expected: [],
    },
    {
      name: 'getWifiList returns wifiList from state',
      selector: Selectors.getWifiList,
      state: {
        networking: {
          robotName: {
            wifiList: [Fixtures.mockWifiNetwork],
          },
        },
      },
      args: ['robotName'],
      expected: [Fixtures.mockWifiNetwork],
    },
    {
      name: 'getWifiList dedupes duplicate SSIDs',
      selector: Selectors.getWifiList,
      state: {
        networking: {
          robotName: {
            wifiList: [Fixtures.mockWifiNetwork, Fixtures.mockWifiNetwork],
          },
        },
      },
      args: ['robotName'],
      expected: [Fixtures.mockWifiNetwork],
    },
    {
      name: 'getWifiList sorts by active then ssid',
      selector: Selectors.getWifiList,
      state: {
        networking: {
          robotName: {
            wifiList: [
              { ...Fixtures.mockWifiNetwork, ssid: 'bbb' },
              { ...Fixtures.mockWifiNetwork, ssid: 'aaa' },
              { ...Fixtures.mockWifiNetwork, active: true, ssid: 'zzz' },
            ],
          },
        },
      },
      args: ['robotName'],
      expected: [
        { ...Fixtures.mockWifiNetwork, active: true, ssid: 'zzz' },
        { ...Fixtures.mockWifiNetwork, ssid: 'aaa' },
        { ...Fixtures.mockWifiNetwork, ssid: 'bbb' },
      ],
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec

    test(name, () => {
      const result = selector(state, ...args)
      expect(result).toEqual(expected)
    })
  })
})
