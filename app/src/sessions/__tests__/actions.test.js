// @flow

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { RobotSessionAction } from '../types'

import { mockV2ErrorResponse } from '../../robot-api/__fixtures__'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotSessionAction,
|}

describe('robot session check actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'sessions:CREATE_ROBOT_SESSION',
      creator: Actions.createRobotSession,
      args: ['robot-name', 'check'],
      expected: {
        type: 'sessions:CREATE_ROBOT_SESSION',
        payload: { robotName: 'robot-name', sessionType: 'check' },
        meta: {},
      },
    },
    {
      name: 'sessions:CREATE_ROBOT_SESSION_SUCCESS',
      creator: Actions.createRobotSessionSuccess,
      args: ['robot-name', Fixtures.mockRobotSessionData, { requestId: 'abc' }],
      expected: {
        type: 'sessions:CREATE_ROBOT_SESSION_SUCCESS',
        payload: { robotName: 'robot-name', ...Fixtures.mockRobotSessionData },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:CREATE_ROBOT_SESSION_FAILURE',
      creator: Actions.createRobotSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:CREATE_ROBOT_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:DELETE_ROBOT_SESSION',
      creator: Actions.deleteRobotSession,
      args: ['robot-name', '1234'],
      expected: {
        type: 'sessions:DELETE_ROBOT_SESSION',
        payload: { robotName: 'robot-name', sessionId: '1234' },
        meta: {},
      },
    },
    {
      name: 'sessions:DELETE_ROBOT_SESSION_SUCCESS',
      creator: Actions.deleteRobotSessionSuccess,
      args: ['robot-name', Fixtures.mockRobotSessionData, { requestId: 'abc' }],
      expected: {
        type: 'sessions:DELETE_ROBOT_SESSION_SUCCESS',
        payload: { robotName: 'robot-name', ...Fixtures.mockRobotSessionData },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:DELETE_ROBOT_SESSION_FAILURE',
      creator: Actions.deleteRobotSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:DELETE_ROBOT_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:FETCH_ROBOT_SESSION',
      creator: Actions.fetchRobotSession,
      args: ['robot-name', '1234'],
      expected: {
        type: 'sessions:FETCH_ROBOT_SESSION',
        payload: { robotName: 'robot-name', sessionId: '1234' },
        meta: {},
      },
    },
    {
      name: 'sessions:FETCH_ROBOT_SESSION_SUCCESS',
      creator: Actions.fetchRobotSessionSuccess,
      args: ['robot-name', Fixtures.mockRobotSessionData, { requestId: 'abc' }],
      expected: {
        type: 'sessions:FETCH_ROBOT_SESSION_SUCCESS',
        payload: { robotName: 'robot-name', ...Fixtures.mockRobotSessionData },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:FETCH_ROBOT_SESSION_FAILURE',
      creator: Actions.fetchRobotSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:FETCH_ROBOT_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:UPDATE_ROBOT_SESSION',
      creator: Actions.updateRobotSession,
      args: ['robot-name', '1234', Fixtures.mockRobotSessionUpdate],
      expected: {
        type: 'sessions:UPDATE_ROBOT_SESSION',
        payload: {
          robotName: 'robot-name',
          sessionId: '1234',
          update: Fixtures.mockRobotSessionUpdate,
        },
        meta: {},
      },
    },
    {
      name: 'sessions:UPDATE_ROBOT_SESSION_SUCCESS',
      creator: Actions.updateRobotSessionSuccess,
      args: ['robot-name', Fixtures.mockRobotSessionData, { requestId: 'abc' }],
      expected: {
        type: 'sessions:UPDATE_ROBOT_SESSION_SUCCESS',
        payload: { robotName: 'robot-name', ...Fixtures.mockRobotSessionData },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:UPDATE_ROBOT_SESSION_FAILURE',
      creator: Actions.updateRobotSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:UPDATE_ROBOT_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
