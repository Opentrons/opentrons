import { createListenerMiddleware } from '@reduxjs/toolkit'

import { getNextExpiration, timeOutLogin } from './slice'

import type { ListenerEffectAPI } from '@reduxjs/toolkit'
import type { Dispatch, State } from '../types'

/**
 * When we're logged in to a robot, and enough time passes that the login expires,
 * this automatically updates state to reflect the expiration.
 *
 * The server is still ultimately responsible for enforcing that a client can't
 * use an expired access token. So we're not depending on this for security.
 * This is merely for the benefit of UI that shows whether the user is currently
 * logged in.
 */

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
    //    the most recent one.
    //
    // So nothing should be able to dispatch based on stale information.

    listenerAPI.cancelActiveListeners()

    const nextExpiration = getNextExpiration(listenerAPI.getState())
    if (nextExpiration != null) {
      const waitDuration = nextExpiration.expiresAt - Date.now()
      await longDelay(listenerAPI, waitDuration)
      listenerAPI.dispatch(
        timeOutLogin({ robotName: nextExpiration.robotName })
      )
    }
  },
})

// JS's window.setTimeout() function, and by extension Redux's listenerAPI.delay()
// function, can't handle durations bigger than an int32, so we need this workaround.
// Durations probably won't be this long in production, but they might be in testing.
async function longDelay(
  listenerAPI: ListenerEffectAPI<State, Dispatch>,
  waitDuration: number
): Promise<void> {
  const int32Max = 0x7fffffff
  while (waitDuration > int32Max) {
    await listenerAPI.delay(int32Max)
    waitDuration -= int32Max
  }
  await listenerAPI.delay(waitDuration)
}
