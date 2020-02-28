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
        wifiKeys: [],
      },
    },
    expected: {
      [ROBOT_NAME]: {
        wifiList: [],
        wifiKeys: [Fixtures.mockWifiKey],
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
