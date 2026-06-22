import { describe, expect, it } from 'vitest'

import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import { networkingReducer } from '../reducer'

import type { Action } from '../../types'
import type { NetworkingState } from '../types'

interface ReducerSpec {
  name: string
  state: NetworkingState
  action: Action
  expected: NetworkingState
}

const ROBOT_NAME = 'robotName'

const SPECS: ReducerSpec[] = [
  {
    name: 'handles fetch status success action',
    action: Actions.fetchStatusSuccess(
      ROBOT_NAME,
      Fixtures.mockNetworkingStatus.status,
      Fixtures.mockNetworkingStatus.interfaces,
      {} as any
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
    name: 'handles fetch eap options success action',
    action: Actions.fetchEapOptionsSuccess(
      ROBOT_NAME,
      [Fixtures.mockEapOption],
      {} as any
    ),
    state: {
      [ROBOT_NAME]: { eapOptions: [] },
    },
    expected: {
      [ROBOT_NAME]: {
        eapOptions: [Fixtures.mockEapOption],
      },
    },
  },

  {
    name: 'handles clear wifi status action',
    action: Actions.clearWifiStatus(ROBOT_NAME),
    state: {
      [ROBOT_NAME]: Fixtures.mockNetworkingStatus,
    },
    expected: {
      [ROBOT_NAME]: {
        ...Fixtures.mockNetworkingStatus,
        interfaces: {
          ...Fixtures.mockNetworkingStatus.interfaces,
          wlan0: {
            ipAddress: null,
            macAddress: 'unknown',
            gatewayAddress: null,
            state: 'disconnected',
            type: 'wifi',
          },
        },
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
