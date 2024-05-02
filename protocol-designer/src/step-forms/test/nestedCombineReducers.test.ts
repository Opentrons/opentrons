import { describe, it, expect } from 'vitest'
import { nestedCombineReducers } from '../reducers/nestedCombineReducers'
import type { Action } from 'redux'

// typical reducer, only gets its own substate
const fruits = (
  state = [],
  action: Record<string, any>
): Record<string, any> => {
  if (action.type === 'ADD_FRUIT') {
    return [...state, action.payload]
  }

  return state
}

// "top-level" reducer, gets whole nestedCombineReducers state
const warnings = (
  rootState: Record<string, any>,
  action: Record<string, any>
): Record<string, any> => {
  const substate = rootState?.warnings || {}

  if (action.type === 'ADD_FRUIT' && action.payload === 'durian') {
    return { ...substate, durianWarning: 'Oh no not a durian' }
  }

  return substate
}

describe('nestedCombineReducers', () => {
  const combinedReducer = nestedCombineReducers(
    ({ action, state, prevStateFallback }) => ({
      // fruits only gets its own state (always from prevStateFallback)
      fruits: fruits(prevStateFallback.fruits, action),
      // warnings gets the full state
      warnings: warnings(state, action),
    })
  )
  it('should populate with initial undefined state (unhandled action)', () => {
    const result = combinedReducer(undefined, {
      type: 'FOO_WHATEVER_ACTION',
    })
    expect(result).toStrictEqual({
      fruits: [],
      warnings: {},
    })
  })
  it('should populate with initial undefined state (handled action)', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result = combinedReducer(undefined, {
      type: 'ADD_FRUIT',
      payload: 'durian',
    } as Action)
    expect(result).toEqual({
      fruits: ['durian'],
      warnings: {
        durianWarning: 'Oh no not a durian',
      },
    })
  })
  it('should update the previous state according to the getNextState callback', () => {
    const prevState = {
      fruits: ['banana'],
      warnings: {},
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result = combinedReducer(prevState, {
      type: 'ADD_FRUIT',
      payload: 'durian',
    } as Action)
    expect(result).toEqual({
      fruits: ['banana', 'durian'],
      warnings: {
        durianWarning: 'Oh no not a durian',
      },
    })
  })
  it('should return the same state when no reducers have updated', () => {
    const prevState = {
      fruits: ['banana'],
      warnings: {},
    }
    const result = combinedReducer(prevState, {
      type: 'NO_OP_ACTION_EXAMPLE',
    })
    expect(result).toStrictEqual(prevState)
  })
  it('should throw an error when any sub-reducer returns undefined', () => {
    // counts total fruits added, but we "accidentally" return undefined for any other actions
    const badCountReducer = (
      state: number | undefined,
      action: Action<any>
    ): number | undefined => {
      if (state === undefined) {
        // weird way to initialize, but otherwise this will fail b/c
        // the reducer initializes to undefined
        // (which we'll test for separately!)
        return 0
      }

      if (action.type === 'ADD_FRUIT') {
        return state + 1
      }

      // should be `return state` here, but we're pretending we made a mistake writing this reducer
      // and omitted `return state`, which would mean implicitly returning undefined
      return undefined
    }

    const badCombinedReducer = nestedCombineReducers(
      ({ action, state, prevStateFallback }) => ({
        // fruits only gets its own state (always from prevStateFallback)
        fruits: fruits(prevStateFallback.fruits, action),
        // warnings gets the full state
        warnings: warnings(state, action),
        badCountReducer: badCountReducer(
          prevStateFallback.badCountReducer,
          action
        ),
      })
    )
    expect(() => {
      badCombinedReducer(
        {
          fruits: [],
          warnings: {},
          badCountReducer: 0,
        },
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          type: 'UNHANDLED_ACTION',
          payload: 'foo',
        } as Action
      )
    }).toThrowError(
      'Given action "UNHANDLED_ACTION", reducer "badCountReducer" returned undefined. To ignore an action, you must explicitly return the previous state. If you want this reducer to hold no value, you can return null instead of undefined.'
    )
  })
  it('should throw an error when any sub-reducer initializes to undefined', () => {
    // counts fruits added, but we "forgot" to give it an initial state
    const badCountReducer = (state: number, action: Action<any>): number => {
      if (action.type === 'ADD_FRUIT') {
        return state + 1
      }

      return state
    }

    expect(() => {
      // note that we're asserting on the factory call, it errors before
      // we even get to the first actual action
      nestedCombineReducers(({ action, state, prevStateFallback }) => ({
        fruits: fruits(prevStateFallback.fruits, action),
        warnings: warnings(state, action),
        badCountReducer: badCountReducer(
          prevStateFallback.badCountReducer,
          action
        ),
      }))
    }).toThrowError(
      `Reducer "badCountReducer" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`
    )
  })
})
