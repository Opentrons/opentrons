// @flow
import * as Fixtures from '../__fixtures__'
import { pipettesReducer } from '../reducer'

import type { Action } from '../../types'
import type { PipettesState } from '../types'

type ReducerSpec = {|
  name: string,
  state: PipettesState,
  action: Action,
  expected: PipettesState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles pipettes:FETCH_PIPETTES_SUCCESS',
    action: {
      type: 'pipettes:FETCH_PIPETTES_SUCCESS',
      payload: {
        robotName: 'robotName',
        pipettes: {
          left: null,
          right: Fixtures.mockAttachedPipette,
        },
      },
      meta: {},
    },
    state: {
      robotName: { attachedByMount: { left: null, right: null } },
    },
    expected: {
      robotName: {
        attachedByMount: {
          left: null,
          right: Fixtures.mockAttachedPipette,
        },
      },
    },
  },
]

describe('pipettesReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    test(name, () => expect(pipettesReducer(state, action)).toEqual(expected))
  })
})
