// @flow

import * as Actions from '../actions'

import type { PipettesAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: PipettesAction,
|}

describe('robot settings actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'pipettes:FETCH_PIPETTES without refresh',
      creator: Actions.fetchPipettes,
      args: ['robot-name'],
      expected: {
        type: 'pipettes:FETCH_PIPETTES',
        payload: { robotName: 'robot-name', refresh: false },
        meta: {},
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES with refresh',
      creator: Actions.fetchPipettes,
      args: ['robot-name', true],
      expected: {
        type: 'pipettes:FETCH_PIPETTES',
        payload: { robotName: 'robot-name', refresh: true },
        meta: {},
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES_SUCCESS',
      creator: Actions.fetchPipettesSuccess,
      args: ['robot-name', { left: null, right: null }, { requestId: 'abc' }],
      expected: {
        type: 'pipettes:FETCH_PIPETTES_SUCCESS',
        payload: {
          robotName: 'robot-name',
          pipettes: { left: null, right: null },
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES_FAILURE',
      creator: Actions.fetchPipettesFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'pipettes:FETCH_PIPETTES_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
