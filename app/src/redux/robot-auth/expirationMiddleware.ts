import { createListenerMiddleware } from '@reduxjs/toolkit'

import { getNextExpiration, logOutOrTimeOut } from './slice'

import type { Dispatch, State } from '../types'

export const expirationMiddleware = createListenerMiddleware()

expirationMiddleware.startListening.withTypes<State, Dispatch>()({
  predicate: (_action, currentState, originalState) => {
    // Run whenever there's a change to the next scheduled expiration.
    // We're relying on having good memoization here.
    return getNextExpiration(currentState) !== getNextExpiration(originalState)
  },
  effect: async (_action, listenerAPI) => {
    // There has been a change to the next scheduled expiration. We'll wait until we
    // reach the scheduled time, then dispatch an action to reflect the expiration.
    //
    // The next scheduled expiration might change again while we're waiting.
    // For example, the login might get refreshed, which should postpone its expiration.
    // To account for this:
    //
    // 1. We run a fresh instance of this handler any time there's a change to any
    //    relevant state. See `predicate` above.
    // 2. We make sure there's at most one instance of this handler running at a time,
    //    the most recent one. So nothing should be able to dispatch based on stale information.

    listenerAPI.cancelActiveListeners()

    const nextExpiration = getNextExpiration(listenerAPI.getState())
    if (nextExpiration != null) {
      const waitDuration = nextExpiration.expiresAt - Date.now()
      await listenerAPI.delay(waitDuration)
      listenerAPI.dispatch(
        logOutOrTimeOut({ robotName: nextExpiration.robotName })
      )
    }
  },
})
