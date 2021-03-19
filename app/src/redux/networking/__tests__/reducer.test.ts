// @flow
import * as Fixtures from '../__fixtures__'
import { networkingReducer } from '../reducer'
import * as Actions from '../actions'

import type { Action } from '../../types'
import type { NetworkingState } from '../types'

type ReducerSpec = {|
  name: string,
  state: NetworkingState,
  action: Action,
  expected: NetworkingState,
|}

const ROBOT_NAME = 'robotName'

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles fetch status success action',
    action: Actions.fetchStatusSuccess(
      ROBOT_NAME,
      Fixtures.mockNetworkingStatus.status,
      Fixtures.mockNetworkingStatus.interfaces,
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
      },
    },
    expected: {
      [ROBOT_NAME]: {
        internetStatus: Fixtures.mockNetworkingStatus.status,
        interfaces: Fixtures.mockNetworkingStatus.interfaces,
        wifiList: [],
      },
    },
  },
  {
    name: 'handles fetch wifi list success action',
    action: Actions.fetchWifiListSuccess(
      ROBOT_NAME,
      [Fixtures.mockWifiNetwork],
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        internetStatus: Fixtures.mockNetworkingStatus.status,
        interfaces: Fixtures.mockNetworkingStatus.interfaces,
        wifiList: [],
      },
    },
    expected: {
      [ROBOT_NAME]: {
        internetStatus: Fixtures.mockNetworkingStatus.status,
        interfaces: Fixtures.mockNetworkingStatus.interfaces,
        wifiList: [Fixtures.mockWifiNetwork],
      },
    },
  },
  {
    name: 'handles fetch wifi keys success action',
    action: Actions.fetchWifiKeysSuccess(
      ROBOT_NAME,
      [Fixtures.mockWifiKey],
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [],
        wifiKeysById: {},
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id],
        wifiKeysById: { [Fixtures.mockWifiKey.id]: Fixtures.mockWifiKey },
      },
    },
  },
  {
    name: 'handles post wifi keys success action',
    action: Actions.postWifiKeysSuccess(
      ROBOT_NAME,
      { ...Fixtures.mockWifiKey, id: 'foobar' },
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id],
        wifiKeysById: { [Fixtures.mockWifiKey.id]: Fixtures.mockWifiKey },
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id, 'foobar'],
        wifiKeysById: {
          [Fixtures.mockWifiKey.id]: Fixtures.mockWifiKey,
          foobar: { ...Fixtures.mockWifiKey, id: 'foobar' },
        },
      },
    },
  },
  {
    name: 'handles post wifi keys success action with requestId',
    action: Actions.postWifiKeysSuccess(ROBOT_NAME, Fixtures.mockWifiKey, {
      requestId: 'request-id',
    }),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [],
        wifiKeysById: {},
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id],
        wifiKeysById: {
          [Fixtures.mockWifiKey.id]: {
            ...Fixtures.mockWifiKey,
            requestId: 'request-id',
          },
        },
      },
    },
  },
  {
    name: 'handles post wifi keys success action with existing key',
    action: Actions.postWifiKeysSuccess(ROBOT_NAME, Fixtures.mockWifiKey, {}),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id],
        wifiKeysById: { [Fixtures.mockWifiKey.id]: Fixtures.mockWifiKey },
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: [Fixtures.mockWifiKey.id],
        wifiKeysById: { [Fixtures.mockWifiKey.id]: Fixtures.mockWifiKey },
      },
    },
  },
  {
    name: 'fetch wifi keys success does not re-order keys',
    action: Actions.fetchWifiKeysSuccess(
      ROBOT_NAME,
      [
        { ...Fixtures.mockWifiKey, id: 'def' },
        { ...Fixtures.mockWifiKey, id: 'abc' },
      ],
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: ['abc', 'def'],
        wifiKeysById: {
          abc: { ...Fixtures.mockWifiKey, id: 'abc' },
          def: { ...Fixtures.mockWifiKey, id: 'def' },
        },
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: ['abc', 'def'],
        wifiKeysById: {
          abc: { ...Fixtures.mockWifiKey, id: 'abc' },
          def: { ...Fixtures.mockWifiKey, id: 'def' },
        },
      },
    },
  },
  {
    name: 'fetch wifi keys success removes keys that are gone',
    action: Actions.fetchWifiKeysSuccess(
      ROBOT_NAME,
      [{ ...Fixtures.mockWifiKey, id: 'abc' }],
      {}
    ),
    state: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: ['abc', 'def'],
        wifiKeysById: {
          abc: { ...Fixtures.mockWifiKey, id: 'abc' },
          def: { ...Fixtures.mockWifiKey, id: 'def' },
        },
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeyIds: ['abc'],
        wifiKeysById: {
          abc: { ...Fixtures.mockWifiKey, id: 'abc' },
        },
      },
    },
  },
  {
    name: 'handles fetch eap options success action',
    action: Actions.fetchEapOptionsSuccess(
      ROBOT_NAME,
      [Fixtures.mockEapOption],
      {}
    ),
    state: {
      [ROBOT_NAME]: { wifiKeyIds: [], wifiKeysById: {}, eapOptions: [] },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiKeyIds: [],
        wifiKeysById: {},
        eapOptions: [Fixtures.mockEapOption],
      },
    },
  },
]

describe('networkingReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(networkingReducer(state, action)).toEqual(expected))
  })
})
