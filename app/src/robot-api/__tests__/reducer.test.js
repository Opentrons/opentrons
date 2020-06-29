// @flow
import { mockFailedRequestState } from '../__fixtures__'
import { robotApiReducer } from '../reducer'
import type { RobotApiState } from '../types'

type ReducerSpec = {|
  name: string,
  state: RobotApiState,
  action: any,
  expected: RobotApiState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles an action with meta.requestId and no response',
    state: { def: { status: 'pending' } },
    action: {
      type: 'someScope:FETCH_THING',
      meta: { requestId: 'abc' },
    },
    expected: { abc: { status: 'pending' }, def: { status: 'pending' } },
  },
  {
    name: 'handles an action with meta.requestId and success response',
    state: { abc: { status: 'pending' }, def: { status: 'pending' } },
    action: {
      type: 'someScope:FETCH_THING_SUCCESS',
      payload: { thing: 42 },
      meta: { requestId: 'abc', response: { ok: true } },
    },
    expected: {
      abc: { status: 'success', response: ({ ok: true }: any) },
      def: { status: 'pending' },
    },
  },
  {
    name: 'handles an action with meta.requestId and failure response',
    state: { abc: { status: 'pending' }, def: { status: 'pending' } },
    action: {
      type: 'someScope:FETCH_THING_FAILURE',
      payload: { error: { message: 'AH' } },
      meta: { requestId: 'abc', response: { ok: false } },
    },
    expected: {
      abc: {
        status: 'failure',
        response: ({ ok: false }: any),
        error: { message: 'AH' },
      },
      def: { status: 'pending' },
    },
  },
  {
    name: 'handles a dismiss request action',
    state: {
      abc: mockFailedRequestState,
      def: { status: 'pending' },
    },
    action: {
      type: 'robotApi:DISMISS_REQUEST',
      payload: { requestId: 'abc' },
    },
    expected: {
      def: { status: 'pending' },
    },
  },
]

describe('robotApiReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(robotApiReducer(state, action)).toEqual(expected))
  })
})
