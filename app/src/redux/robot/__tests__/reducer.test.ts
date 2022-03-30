// connection reducer tests
import { robotReducer as reducer } from '../'

import type { Action } from '../../types'
import type { RobotState } from '../reducer'
import type { ConnectionState } from '../reducer/connection'

// TODO(mc, 2022-03-04): remove vesitgal state.
const getState = (state: RobotState): ConnectionState => state.connection

describe('robot reducer - connection', () => {
  it('initial state', () => {
    const state = reducer(undefined, {} as any)

    expect(getState(state)).toEqual({
      connectedTo: null,
    })
  })

  it('handles CONNECT action', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
      },
    } as any

    const action: Action = {
      type: 'robot:CONNECT',
      payload: { name: 'ot' },
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
    })
  })

  it('handles DISCONNECT action', () => {
    const state: RobotState = {
      connection: {
        connectedTo: 'ot',
      },
    } as any
    const action: Action = { type: 'robot:DISCONNECT' }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
    })
  })
})
