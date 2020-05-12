// @flow

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { SessionsAction } from '../types'

import { mockV2ErrorResponse } from '../../robot-api/__fixtures__'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: SessionsAction,
|}

describe('robot session check actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'sessions:CREATE_SESSION',
      creator: Actions.createSession,
      args: ['robot-name', 'calibrationCheck'],
      expected: {
        type: 'sessions:CREATE_SESSION',
        payload: { robotName: 'robot-name', sessionType: 'calibrationCheck' },
        meta: {},
      },
    },
    {
      name: 'sessions:CREATE_SESSION_SUCCESS',
      creator: Actions.createSessionSuccess,
      args: ['robot-name', Fixtures.mockSessionResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:CREATE_SESSION_SUCCESS',
        payload: {
          robotName: 'robot-name',
          ...Fixtures.mockSessionResponse,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:CREATE_SESSION_FAILURE',
      creator: Actions.createSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:CREATE_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:DELETE_SESSION',
      creator: Actions.deleteSession,
      args: ['robot-name', '1234'],
      expected: {
        type: 'sessions:DELETE_SESSION',
        payload: { robotName: 'robot-name', sessionId: '1234' },
        meta: {},
      },
    },
    {
      name: 'sessions:DELETE_SESSION_SUCCESS',
      creator: Actions.deleteSessionSuccess,
      args: ['robot-name', Fixtures.mockSessionResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:DELETE_SESSION_SUCCESS',
        payload: {
          robotName: 'robot-name',
          ...Fixtures.mockSessionResponse,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:DELETE_SESSION_FAILURE',
      creator: Actions.deleteSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:DELETE_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:FETCH_SESSION',
      creator: Actions.fetchSession,
      args: ['robot-name', '1234'],
      expected: {
        type: 'sessions:FETCH_SESSION',
        payload: { robotName: 'robot-name', sessionId: '1234' },
        meta: {},
      },
    },
    {
      name: 'sessions:FETCH_SESSION_SUCCESS',
      creator: Actions.fetchSessionSuccess,
      args: ['robot-name', Fixtures.mockSessionResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:FETCH_SESSION_SUCCESS',
        payload: {
          robotName: 'robot-name',
          ...Fixtures.mockSessionResponse,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:FETCH_SESSION_FAILURE',
      creator: Actions.fetchSessionFailure,
      args: ['robot-name', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:FETCH_SESSION_FAILURE',
        payload: { robotName: 'robot-name', error: mockV2ErrorResponse },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:CREATE_SESSION_COMMAND',
      creator: Actions.createSessionCommand,
      args: ['robot-name', '1234', Fixtures.mockSessionCommand],
      expected: {
        type: 'sessions:CREATE_SESSION_COMMAND',
        payload: {
          robotName: 'robot-name',
          sessionId: '1234',
          command: Fixtures.mockSessionCommand,
        },
        meta: {},
      },
    },
    {
      name: 'sessions:CREATE_SESSION_COMMAND_SUCCESS',
      creator: Actions.createSessionCommandSuccess,
      args: [
        'robot-name',
        '1234',
        Fixtures.mockSessionCommandResponse,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'sessions:CREATE_SESSION_COMMAND_SUCCESS',
        payload: {
          robotName: 'robot-name',
          sessionId: '1234',
          ...Fixtures.mockSessionCommandResponse,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'sessions:CREATE_SESSION_COMMAND_FAILURE',
      creator: Actions.createSessionCommandFailure,
      args: ['robot-name', '1234', mockV2ErrorResponse, { requestId: 'abc' }],
      expected: {
        type: 'sessions:CREATE_SESSION_COMMAND_FAILURE',
        payload: {
          robotName: 'robot-name',
          sessionId: '1234',
          error: mockV2ErrorResponse,
        },
        meta: { requestId: 'abc' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
