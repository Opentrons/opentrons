// @flow
// utility functions
// DEPRECATED(mc, 2020-01-13): do not add to nor import from this file
import type { Action, ThunkAction, ThunkPromiseAction } from './types'
import { createLogger } from './logger'

type Chainable = Action | ThunkAction | ThunkPromiseAction

type ChainAction = Promise<?Action>

const log = createLogger(__filename)

// dispatch a chain of actions or thunk actions until an error occurs
// error means: error in action, error in payload, or promise rejection
// TODO(mc, 2018-06-11): This is a little too bespoke for my tastes. Explore
//   npm for available ecosystem solutions soon
export function chainActions(...actions: Array<Chainable>): ThunkPromiseAction {
  let i = 0
  let result: ?Action = null

  return dispatch => {
    return next()

    function next(): ChainAction {
      const current = actions[i]

      if (!current) return resolveResult()

      i++
      // TODO(mc, 2018-06-11): Should we debounce plain actions with RAF?
      result = dispatch(current)
      if (result && result.then) return result.then(handleAction, handleError)
      return handleAction(result)
    }

    function handleAction(action: ?Action): ChainAction {
      if (
        action &&
        (action.error || (action.payload && action.payload.error))
      ) {
        log.debug('Early return from action chain', { action })
        return resolveResult()
      }

      return next()
    }

    function handleError(error): ChainAction {
      log.error('ThunkPromiseAction in chain rejected', { error })
      result = null
      return resolveResult()
    }

    function resolveResult(): ChainAction {
      return Promise.resolve(result)
    }
  }
}
