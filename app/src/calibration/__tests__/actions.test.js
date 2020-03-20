// @flow

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { CalibrationAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: CalibrationAction,
|}

describe('robot modules actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'calibration:FETCH_DECK_CHECK_SESSION',
      creator: Actions.fetchDeckCheckSession,
      args: ['robot-name'],
      expected: {
        type: 'calibration:FETCH_DECK_CHECK_SESSION',
        payload: { robotName: 'robot-name' },
        meta: {},
      },
    },
    {
      name: 'calibration:FETCH_DECK_CHECK_SESSION_SUCCESS',
      creator: Actions.fetchDeckCheckSessionSuccess,
      args: [
        'robot-name',
        Fixtures.mockDeckCheckSessionData,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:FETCH_DECK_CHECK_SESSION_SUCCESS',
        payload: {
          robotName: 'robot-name',
          ...Fixtures.mockDeckCheckSessionData,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:FETCH_DECK_CHECK_SESSION_FAILURE',
      creator: Actions.fetchDeckCheckSessionFailure,
      args: [
        'robot-name',
        { message: 'Heck, your deck check wrecked!' },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:FETCH_DECK_CHECK_SESSION_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'Heck, your deck check wrecked!' },
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:END_DECK_CHECK_SESSION',
      creator: Actions.endDeckCheckSession,
      args: ['robot-name'],
      expected: {
        type: 'calibration:END_DECK_CHECK_SESSION',
        payload: { robotName: 'robot-name' },
        meta: {},
      },
    },
    {
      name: 'calibration:END_DECK_CHECK_SESSION_SUCCESS',
      creator: Actions.endDeckCheckSessionSuccess,
      args: [
        'robot-name',
        Fixtures.mockDeckCheckSessionData,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:END_DECK_CHECK_SESSION_SUCCESS',
        payload: { robotName: 'robot-name' },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:END_DECK_CHECK_SESSION_FAILURE',
      creator: Actions.endDeckCheckSessionFailure,
      args: [
        'robot-name',
        {
          message: 'Heck, your deck check wreck attempt did not go as specced!',
        },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:END_DECK_CHECK_SESSION_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: {
            message:
              'Heck, your deck check wreck attempt did not go as specced!',
          },
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
