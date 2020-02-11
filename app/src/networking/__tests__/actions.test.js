// @flow

import { mockRobot, mockRequestMeta } from '../../robot-api/__fixtures__'
import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { NetworkingAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: NetworkingAction,
|}

describe('networking actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'networking:FETCH_STATUS',
      creator: Actions.fetchStatus,
      args: [mockRobot.name],
      expected: {
        type: 'networking:FETCH_STATUS',
        payload: { robotName: mockRobot.name },
        meta: {},
      },
    },
    {
      name: 'networking:FETCH_STATUS_SUCCESS',
      creator: Actions.fetchStatusSuccess,
      args: [
        mockRobot.name,
        Fixtures.mockNetworkingStatusSuccess.body.status,
        Fixtures.mockNetworkingStatusSuccess.body.interfaces,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_STATUS_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          internetStatus: Fixtures.mockNetworkingStatusSuccess.body.status,
          interfaces: Fixtures.mockNetworkingStatusSuccess.body.interfaces,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'networking:FETCH_STATUS_FAILURE',
      creator: Actions.fetchStatusFailure,
      args: [
        mockRobot.name,
        Fixtures.mockNetworkingStatusFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_STATUS_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockNetworkingStatusFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
