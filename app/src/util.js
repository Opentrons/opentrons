// @flow
// utility functions
import type {Dispatch, GetState, Action, ThunkAction, ThunkPromiseAction} from './types'
import createLogger from './logger'

type Chainable = Action | ThunkAction | ThunkPromiseAction

type ChainAction = ?Action | Promise<?Action>

type ThunkChain = (Dispatch, GetState) => ChainAction

const log = createLogger(__filename)

export function delay (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// dispatch a chain of actions or thunk actions until an error occurs
// error means: error in action, error in payload, or promise rejection
// TODO(mc, 2018-06-11): This is a little too bespoke for my tastes. Explore
//   npm for available ecosystem solutions soon
export function chainActions (...actions: Array<Chainable>): ThunkChain {
  let i = 0
  let result: ?Action = null

  return (dispatch) => {
    return next()

    function next (): ChainAction {
      const current = actions[i]

      if (!current) return result

      i++
      // TODO(mc, 2018-06-11): Should we debounce plain actions with RAF?
      result = dispatch(current)

      if (result.then) return result.then(handleAction, handleError)
      return handleAction(result)
    }

    function handleAction (action: ?Action): ChainAction {
      if (
        action &&
        // $FlowFixMe: Flow complains about accessing `error` on payload
        (action.error || (action.payload && action.payload.error))
      ) {
        log.debug('Early return from action chain', {action})
        return result
      }

      return next()
    }

    function handleError (error) {
      log.error('ThunkPromiseAction in chain rejected', {error})
      return null
    }
  }
}
