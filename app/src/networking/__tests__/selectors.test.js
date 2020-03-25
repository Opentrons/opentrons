// @flow
import noop from 'lodash/noop'
import * as Config from '../../config'
import * as Discovery from '../../discovery'
import * as Selectors from '../selectors'
import * as Constants from '../constants'
import * as Fixtures from '../__fixtures__'

import type { State } from '../../types'

jest.mock('../../config/selectors')
jest.mock('../../discovery/selectors')

const getRobotApiVersionByName: JestMockFn<
  [State, string],
  $Call<typeof Discovery.getRobotApiVersionByName, State, string>
> = Discovery.getRobotApiVersionByName

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

type SelectorSpec = {|
  name: string,
  selector: ($Shape<State>, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  before?: (spec: SelectorSpec) => mixed,
  expected: mixed,
|}

describe('robot settings selectors', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

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
    {
      name: 'getWifiList sorts by active then ssid then dedupes',
      selector: Selectors.getWifiList,
      state: {
        networking: {
          robotName: {
            wifiList: [
              { ...Fixtures.mockWifiNetwork, ssid: 'bbb' },
              { ...Fixtures.mockWifiNetwork, ssid: 'aaa' },
              { ...Fixtures.mockWifiNetwork, active: true, ssid: 'aaa' },
            ],
          },
        },
      },
      args: ['robotName'],
      expected: [
        { ...Fixtures.mockWifiNetwork, active: true, ssid: 'aaa' },
        { ...Fixtures.mockWifiNetwork, ssid: 'bbb' },
      ],
    },
    {
      name: 'getWifiKeys returns [] if unavailable',
      selector: Selectors.getWifiKeys,
      state: {
        networking: {},
      },
      args: ['robotName'],
      expected: [],
    },
    {
      name: 'getWifiKeys returns keys from state',
      selector: Selectors.getWifiKeys,
      state: {
        networking: {
          robotName: {
            wifiKeyIds: ['abc', 'def'],
            wifiKeysById: {
              def: { ...Fixtures.mockWifiKey, id: 'def' },
              abc: { ...Fixtures.mockWifiKey, id: 'abc' },
            },
          },
        },
      },
      args: ['robotName'],
      expected: [
        { ...Fixtures.mockWifiKey, id: 'abc' },
        { ...Fixtures.mockWifiKey, id: 'def' },
      ],
    },
    {
      name: 'getWifiKeyByRequestId returns key with request ID',
      selector: Selectors.getWifiKeyByRequestId,
      state: {
        networking: {
          robotName: {
            wifiKeyIds: ['abc', 'def'],
            wifiKeysById: {
              def: { ...Fixtures.mockWifiKey, id: 'def' },
              abc: { ...Fixtures.mockWifiKey, id: 'abc', requestId: 'foobar' },
            },
          },
        },
      },
      args: ['robotName', 'foobar'],
      expected: { ...Fixtures.mockWifiKey, id: 'abc', requestId: 'foobar' },
    },
    {
      name: 'getWifiKeyByRequestId returns null if not found',
      selector: Selectors.getWifiKeyByRequestId,
      state: {
        networking: {
          robotName: {
            wifiKeyIds: ['abc', 'def'],
            wifiKeysById: {
              def: { ...Fixtures.mockWifiKey, id: 'def' },
              abc: { ...Fixtures.mockWifiKey, id: 'abc' },
            },
          },
        },
      },
      args: ['robotName', 'foobar'],
      expected: null,
    },
    {
      name: 'getEapOptions returns [] if unavailable',
      selector: Selectors.getEapOptions,
      state: {
        networking: {},
      },
      args: ['robotName'],
      expected: [],
    },
    {
      name: 'getEapOptions returns options from state',
      selector: Selectors.getEapOptions,
      state: {
        networking: {
          robotName: {
            eapOptions: [Fixtures.mockEapOption],
          },
        },
      },
      args: ['robotName'],
      expected: [Fixtures.mockEapOption],
    },
    {
      // TODO(mc, 2020-03-03): remove disconnect feature flag
      name:
        'getCanDisconnect returns true if active network, robot >= 3.17, FF on',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {
          robotName: {
            wifiList: [{ ...Fixtures.mockWifiNetwork, active: true }],
          },
        },
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockImplementation(state => {
          expect(state).toEqual(mockState)
          return { enableWifiDisconnect: true }
        })
        getRobotApiVersionByName.mockImplementation((state, robotName) => {
          expect(state).toEqual(mockState)
          expect(robotName).toEqual('robotName')
          return '3.17.0'
        })
      },
      expected: true,
    },
    {
      name: 'getCanDisconnect returns false if no list in state',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {},
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockReturnValue({ enableWifiDisconnect: true })
        getRobotApiVersionByName.mockReturnValue('3.17.0')
      },
      expected: false,
    },
    {
      name: 'getCanDisconnect returns false if no active network',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {
          robotName: {
            wifiList: [{ ...Fixtures.mockWifiNetwork, active: false }],
          },
        },
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockReturnValue({ enableWifiDisconnect: true })
        getRobotApiVersionByName.mockReturnValue('3.17.0')
      },
      expected: false,
    },
    {
      name: 'getCanDisconnect returns false if less than 3.17.0',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {
          robotName: {
            wifiList: [{ ...Fixtures.mockWifiNetwork, active: true }],
          },
        },
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockReturnValue({ enableWifiDisconnect: true })
        getRobotApiVersionByName.mockReturnValue('3.16.999')
      },
      expected: false,
    },
    {
      name: 'getCanDisconnect returns false if robot API version not found',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {
          robotName: {
            wifiList: [{ ...Fixtures.mockWifiNetwork, active: true }],
          },
        },
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockReturnValue({ enableWifiDisconnect: true })
        getRobotApiVersionByName.mockReturnValue(null)
      },
      expected: false,
    },
    {
      // TODO(mc, 2020-03-03): remove disconnect feature flag
      name: 'getCanDisconnect returns false if FF off',
      selector: Selectors.getCanDisconnect,
      state: {
        networking: {
          robotName: {
            wifiList: [{ ...Fixtures.mockWifiNetwork, active: true }],
          },
        },
      },
      args: ['robotName'],
      before: ({ state: mockState }) => {
        getFeatureFlags.mockReturnValue({})
        getRobotApiVersionByName.mockReturnValue('3.17.0')
      },
      expected: false,
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec

    it(name, () => {
      before(spec)
      const result = selector(state, ...args)
      expect(result).toEqual(expected)
    })
  })
})
