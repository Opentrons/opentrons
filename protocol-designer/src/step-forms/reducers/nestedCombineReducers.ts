import { Action, Reducer } from 'redux'
export type GetNextState = (arg0: {
  action: Record<string, any>
  state: Record<string, any>
  prevStateFallback: Record<string, any>
}) => Record<string, any>

const getUndefinedStateErrorMessage = (
  key: string,
  action: Record<string, any>
): string => {
  const actionType = action && action.type
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'
  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}

// an arbitrary used to test for initialization
const FAKE_INIT_ACTION = '@@redux/INITnestedCombineReducers'

const assertReducerShape = (getNextState: GetNextState): void => {
  const initialState = getNextState({
    // @ts-expect-error(sa, 2021-6-10): adjust to adhere to GetNextState.action type
    action: FAKE_INIT_ACTION,
    // @ts-expect-error(sa, 2021-6-10): adjust to adhere to GetNextState.state type
    state: undefined,
    prevStateFallback: {},
  })
  Object.keys(initialState).forEach(key => {
    if (initialState[key] === undefined) {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }
  })
}

export function nestedCombineReducers<
  S extends Record<string, any>,
  A extends Action
>(getNextState: GetNextState): Reducer<S, A> {
  assertReducerShape(getNextState)
  return (state, action) => {
    const prevStateFallback = state || {}
    const nextState = getNextState({
      action,
      state,
      prevStateFallback,
    })
    // error if any reducers return undefined, just like redux combineReducers
    Object.keys(nextState).forEach(key => {
      const nextStateForKey = nextState[key]

      if (nextStateForKey === undefined) {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
    })

    if (
      state !== null &&
      typeof state === 'object' &&
      Object.keys(nextState).every(
        (key: string) => state[key] === nextState[key]
      )
    ) {
      // no change
      return state
    }

    return nextState
  }
}
