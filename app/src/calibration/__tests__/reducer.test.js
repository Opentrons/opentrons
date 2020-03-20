// @flow
import * as Fixtures from '../__fixtures__'
import { calibrationReducer } from '../reducer'

import type { Action } from '../../types'
import type { CalibrationState } from '../types'

type ReducerSpec = {|
  name: string,
  state: CalibrationState,
  action: Action,
  expected: CalibrationState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles calibration:FETCH_DECK_CHECK_SESSION_SUCCESS',
    action: {
      type: 'calibration:FETCH_DECK_CHECK_SESSION_SUCCESS',
      payload: {
        robotName: 'terpentine-martini',
        ...Fixtures.mockDeckCheckSessionData,
      },
      meta: {},
    },
    state: {
      'terpentine-martini': {
        deckCheck: null,
      },
    },
    expected: {
      'terpentine-martini': {
        deckCheck: Fixtures.mockDeckCheckSessionData,
      },
    },
  },
  {
    name: 'handles calibration:END_DECK_CHECK_SESSION_SUCCESS',
    action: {
      type: 'calibration:END_DECK_CHECK_SESSION_SUCCESS',
      payload: {
        robotName: 'terpentine-martini',
      },
      meta: {},
    },
    state: {
      'terpentine-martini': {
        deckCheck: Fixtures.mockDeckCheckSessionData,
      },
    },
    expected: {
      'terpentine-martini': {
        deckCheck: null,
      },
    },
  },
]

describe('calibrationReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(calibrationReducer(state, action)).toEqual(expected))
  })
})
