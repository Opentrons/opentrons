// @flow
// support profile epic test
import { TestScheduler } from 'rxjs/testing'
import { configInitialized } from '../../config'
import * as Profile from '../profile'
import * as Event from '../intercom-event'
import { supportEpic } from '../epic'

import type { Action, State } from '../../types'
import type { Config } from '../../config/types'
import type {
  SupportConfig,
  SupportProfileUpdate,
  IntercomEvent,
} from '../types'

jest.mock('../profile')
jest.mock('../intercom-event')

const makeProfileUpdate: JestMockFn<
  [Action, State],
  SupportProfileUpdate | null
> = Profile.makeProfileUpdate

const makeIntercomEvent: JestMockFn<[Action, State], IntercomEvent | null> =
  Event.makeIntercomEvent

const sendEvent: JestMockFn<[IntercomEvent], void> = Event.sendEvent

const initializeProfile: JestMockFn<[SupportConfig], void> =
  Profile.initializeProfile

const updateProfile: JestMockFn<[SupportProfileUpdate], void> =
  Profile.updateProfile

const MOCK_ACTION: Action = ({ type: 'MOCK_ACTION' }: any)
const MOCK_PROFILE_STATE: $Shape<{| ...State, config: $Shape<Config> |}> = {
  config: {
    support: { userId: 'foo', createdAt: 42, name: 'bar', email: null },
  },
}

const MOCK_EVENT_STATE: $Shape<{| ...State |}> = {}

describe('support profile epic', () => {
  let testScheduler

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
      const action$ = hot('-a', {
        a: configInitialized(MOCK_PROFILE_STATE.config),
      })
      const state$ = hot('--')
      const result$ = supportEpic(action$, state$)

      expectObservable(result$, '--')
      flush()

      expect(initializeProfile).toHaveBeenCalledWith(
        MOCK_PROFILE_STATE.config.support
      )
    })
  })

  it('should do nothing with actions that do not map to a profile update', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$, '--')
      flush()

      expect(makeProfileUpdate).toHaveBeenCalledWith(
        MOCK_ACTION,
        MOCK_PROFILE_STATE
      )
    })
  })

  it('should call a profile update ', () => {
    const profileUpdate = { someProp: 'value' }
    makeProfileUpdate.mockReturnValueOnce(profileUpdate)

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$)
      flush()

      expect(updateProfile).toHaveBeenCalledWith(profileUpdate)
    })
  })
})

describe('support event epic', () => {
  let testScheduler

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
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_EVENT_STATE })
      const result$ = supportEpic(action$, state$)

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
    }
    makeIntercomEvent.mockReturnValueOnce(eventPayload)

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_PROFILE_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$)
      flush()

      expect(sendEvent).toHaveBeenCalledWith(eventPayload)
    })
  })
})
