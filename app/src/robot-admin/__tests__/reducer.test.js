// @flow

import { robotAdminReducer } from '../reducer'

import type { Action, ActionLike } from '../../types'
import type { RobotAdminState } from '../types'

type ReducerSpec = {|
  name: string,
  action: Action | ActionLike,
  state: RobotAdminState,
  expected: RobotAdminState,
|}

const mockRobot = { name: 'robotName', ip: '127.0.0.1', port: 31950 }

describe('robotAdminReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles robotAdmin:RESTART',
      action: {
        type: 'robotAdmin:RESTART',
        meta: { robot: true },
        payload: { host: mockRobot, method: 'POST', path: '/server/restart' },
      },
      state: {},
      expected: { robotName: { status: 'restart-pending' } },
    },
    {
      name: 'handles failed robotApi:RESPONSE for POST /server/restart',
      action: {
        type: 'robotApi:ERROR__POST__/server/restart',
        meta: {},
        payload: {
          host: mockRobot,
          method: 'POST',
          path: '/server/restart',
          body: { message: 'AH!' },
          status: 500,
          ok: false,
        },
      },
      state: {},
      expected: { robotName: { status: 'restart-failed' } },
    },
    {
      name: 'discovery:UPDATE_LIST sets status to up if ok: true',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            ({ name: 'a', ip: '192.168.1.1', port: 31950, ok: true }: any),
          ],
        },
      },
      state: {
        a: { status: 'restarting' },
      },
      expected: { a: { status: 'up' } },
    },
    {
      name: 'discovery:UPDATE_LIST leaves restart pending alone if ok: true',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            ({ name: 'a', ip: '192.168.1.1', port: 31950, ok: true }: any),
          ],
        },
      },
      state: {
        a: { status: 'restart-pending' },
      },
      expected: { a: { status: 'restart-pending' } },
    },
    {
      name:
        'discovery:UPDATE_LIST sets restarting if restart pending and ok: false',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            ({ name: 'a', ip: '192.168.1.1', port: 31950, ok: false }: any),
          ],
        },
      },
      state: {
        a: { status: 'restart-pending' },
      },
      expected: { a: { status: 'restarting' } },
    },
    {
      name:
        'discovery:UPDATE_LIST leaves restarting alone if restarting and ok: false',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            ({ name: 'a', ip: '192.168.1.1', port: 31950, ok: false }: any),
          ],
        },
      },
      state: {
        a: { status: 'restarting' },
      },
      expected: { a: { status: 'restarting' } },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, state, expected } = spec

    test(name, () => {
      expect(robotAdminReducer(state, action)).toEqual(expected)
    })
  })
})
