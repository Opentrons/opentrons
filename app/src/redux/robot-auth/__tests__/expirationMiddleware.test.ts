import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rootReducer } from '../../reducer'
import { expirationMiddleware } from '../expirationMiddleware'
import { logIn, refreshLogin } from '../slice'

import type { State } from '../../types'

const T0 = 1000

describe('expirationMiddleware', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: T0,
    })
  })

  afterEach(() => {
    // todo(mm, 2026-05-14): It seems like we ought to cancel any pending tasks
    // here in the cleanup, and/or use a separate middleware instance for each test.
    // The @reduxjs/toolkit APIs for this confuse me. In the meantime, vi.runAllTimers()
    // should be enough to make sure no tasks leak between tests.
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('removes robots from auth state as they expire', async () => {
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().prepend(expirationMiddleware.middleware)
      },
    })

    store.dispatch(
      logIn({
        robotName: 'robot-a-expires-at-3000',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 3000,
      })
    )
    store.dispatch(
      logIn({
        robotName: 'robot-b-expires-at-1000',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 1000,
      })
    )
    store.dispatch(
      logIn({
        robotName: 'robot-c-expires-at-2000',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 2000,
      })
    )
    store.dispatch(
      logIn({
        robotName: 'robot-d-expires-never',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: null,
      })
    )

    await vi.advanceTimersByTimeAsync(500) // Now at T0+500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-a-expires-at-3000',
      'robot-b-expires-at-1000',
      'robot-c-expires-at-2000',
      'robot-d-expires-never',
    ])

    await vi.advanceTimersByTimeAsync(1000) // Now at T0+1500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-a-expires-at-3000',
      'robot-c-expires-at-2000',
      'robot-d-expires-never',
    ])

    await vi.advanceTimersByTimeAsync(1000) // Now at T0+2500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-a-expires-at-3000',
      'robot-d-expires-never',
    ])

    await vi.advanceTimersByTimeAsync(1000) // Now at T0+3500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-d-expires-never',
    ])
  })

  it('handles long (> int32 max) expiration times', async () => {
    const int32Max = 0x7fffffff

    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().prepend(expirationMiddleware.middleware)
      },
    })

    store.dispatch(
      logIn({
        robotName: 'robot-a',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + int32Max + 1000,
      })
    )

    await vi.advanceTimersByTimeAsync(int32Max + 500) // Now at T0+int32Max+500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual(['robot-a'])
    await vi.advanceTimersByTimeAsync(1000) // Now at T0+int32Max+1500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([])
  })

  it('handles an expiration being postponed (a login being refreshed)', async () => {
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().prepend(expirationMiddleware.middleware)
      },
    })

    store.dispatch(
      logIn({
        robotName: 'robot-a',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 1000,
      })
    )
    store.dispatch(
      logIn({
        robotName: 'robot-b',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 1000,
      })
    )

    await vi.advanceTimersByTimeAsync(500) // Now at T0+500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-a',
      'robot-b',
    ])

    store.dispatch(
      refreshLogin({
        robotName: 'robot-a',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 2000,
      })
    )
    await vi.advanceTimersByTimeAsync(1000) // Now at T0+1500.
    expect(getUnexpiredRobots(store.getState())).toStrictEqual(['robot-a'])
  })

  it('immediately removes robots that expire in the past', async () => {
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().prepend(expirationMiddleware.middleware)
      },
    })

    store.dispatch(
      logIn({
        robotName: 'robot-a',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 - 1,
      })
    )
    store.dispatch(
      logIn({
        robotName: 'robot-b',
        username: 'username',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        expiresAt: T0 + 1000,
      })
    )

    expect(getUnexpiredRobots(store.getState())).toStrictEqual([
      'robot-a',
      'robot-b',
    ])
    await vi.advanceTimersByTimeAsync(0)
    expect(getUnexpiredRobots(store.getState())).toStrictEqual(['robot-b'])
  })
})

function getUnexpiredRobots(state: State): string[] {
  return Object.keys(state.robotAuth.perRobotAuthStates).sort()
}
