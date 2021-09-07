import { Action, Reducer } from 'redux'
export type GetNextState<S, A extends Action> = (args: {
  action: A
  state: S
  prevStateFallback: S
}) => S

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

const assertReducerShape = <S extends Record<string, any>, A extends Action>(
  getNextState: GetNextState<S, A>
): void => {
  const initialState = getNextState({
    // @ts-expect-error type FAKE_INIT_ACTION to be of type Action
    action: FAKE_INIT_ACTION,
    // @ts-expect-error(sa, 2021-6-14): type
    state: undefined,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    prevStateFallback: {} as S,
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
>(getNextState: GetNextState<S, A>): Reducer<S, A> {
  assertReducerShape(getNextState)
  return (state, action) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const prevStateFallback = state || ({} as S)
    const nextState = getNextState({
      action,
      // @ts-expect-error(sa, 2021-6-14): getNextState cannot return undefined because our reducers do not expect state to be undefined
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
