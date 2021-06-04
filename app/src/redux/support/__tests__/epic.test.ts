// support profile epic test
import { TestScheduler } from 'rxjs/testing'
import { configInitialized } from '../../config'
import * as Profile from '../profile'
import * as Event from '../intercom-event'
import { supportEpic } from '../epic'

import type { Action, State } from '../../types'
import type { Observable } from 'rxjs'

jest.mock('../profile')
jest.mock('../intercom-event')

const makeProfileUpdate = Profile.makeProfileUpdate as jest.MockedFunction<
  typeof Profile.makeProfileUpdate
>

const makeIntercomEvent = Event.makeIntercomEvent as jest.MockedFunction<
  typeof Event.makeIntercomEvent
>

const sendEvent = Event.sendEvent as jest.MockedFunction<typeof Event.sendEvent>

const initializeProfile = Profile.initializeProfile as jest.MockedFunction<
  typeof Profile.initializeProfile
>

const updateProfile = Profile.updateProfile as jest.MockedFunction<
  typeof Profile.updateProfile
>

const MOCK_ACTION: Action = { type: 'MOCK_ACTION' } as any
const MOCK_PROFILE_STATE: State = {
  config: {
    support: { userId: 'foo', createdAt: 42, name: 'bar', email: null },
  },
} as any

const MOCK_EVENT_STATE: State = {} as any

describe('support profile epic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    makeProfileUpdate.mockReturnValue(null)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should initialize support profile on config:INITIALIZED', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', {
        a: configInitialized(MOCK_PROFILE_STATE.config as any),
      })
      const state$ = hot<State>('--')
      const result$ = supportEpic(action$, state$)

      expectObservable(result$, '--')
      flush()

      expect(initializeProfile).toHaveBeenCalledWith(
        MOCK_PROFILE_STATE.config?.support
      )
    })
  })

  it('should do nothing with actions that do not map to a profile update', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', { a: MOCK_ACTION })
      const state$ = hot<State>('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$, '--')
      flush()

      expect(makeProfileUpdate).toHaveBeenCalledWith(
        MOCK_ACTION,
        MOCK_PROFILE_STATE
      )
    })
  })

  it('should call a profile update', () => {
    const profileUpdate = { someProp: 'value' }
    makeProfileUpdate.mockReturnValueOnce(profileUpdate)

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', { a: MOCK_ACTION })
      const state$ = hot<State>('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$)
      flush()

      expect(updateProfile).toHaveBeenCalledWith(profileUpdate)
    })
  })
})

describe('support event epic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    makeIntercomEvent.mockReturnValue(null)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should do nothing with actions that do not map to an event', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', { a: MOCK_ACTION })
      const state$ = hot<State>('s-', { s: MOCK_EVENT_STATE })
      const result$ = supportEpic(action$, state$ as Observable<State>)

      expectObservable(result$, '--')
      flush()

      expect(makeIntercomEvent).toHaveBeenCalledWith(
        MOCK_ACTION,
        MOCK_EVENT_STATE
      )
      expect(sendEvent).not.toHaveBeenCalled()
    })
  })

  it('should send an event', () => {
    const eventPayload = {
      eventName: 'completed-robot-calibration-check',
      metadata: { someProp: 'value' },
    } as any
    makeIntercomEvent.mockReturnValueOnce(eventPayload)

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', { a: MOCK_ACTION })
      const state$ = hot<State>('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$)
      flush()

      expect(sendEvent).toHaveBeenCalledWith(eventPayload)
    })
  })
})
