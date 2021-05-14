// analytics epics tests
import { TestScheduler } from 'rxjs/testing'

import * as Cfg from '../../config'
import {
  initializeMixpanel,
  trackEvent,
  setMixpanelTracking,
} from '../mixpanel'
import { makeEvent } from '../make-event'
import { analyticsEpic } from '../epic'

import type { Action, State } from '../../types'

jest.mock('../make-event')
jest.mock('../mixpanel')

const makeEventMock = makeEvent as jest.MockedFunction<typeof makeEvent>

describe('analytics epics', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('initializeAnalyticsEpic', () => {
    it('initializes analytics on config:INITIALIZED', () => {
      const action = Cfg.configInitialized({
        analytics: { optedIn: true },
      } as any)

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('--', {} as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('--')
        flush()
        expect(initializeMixpanel).toHaveBeenCalledWith({
          optedIn: true,
        })
      })
    })
  })

  describe('sendAnalyticsEventEpic', () => {
    it('handles events', () => {
      const action = { type: 'foo' }
      const state = { config: { analytics: { optedIn: true } } }
      const event = { name: 'fooEvent', properties: {} }

      testScheduler.run(({ hot, expectObservable, flush }) => {
        makeEventMock.mockReturnValueOnce([event] as any)

        const action$ = hot<Action>('-a', { a: action } as any)
        const state$ = hot<State>('s-', { s: state } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('--')
        flush()
        expect(trackEvent).toHaveBeenCalledWith(event, state.config.analytics)
      })
    })

    it('handles non-events', () => {
      const action = { type: 'foo' }
      const state = { config: { analytics: { optedIn: true } } }

      testScheduler.run(({ hot, expectObservable, flush }) => {
        makeEventMock.mockReturnValueOnce([null] as any)

        const action$ = hot<Action>('-a', { a: action } as any)
        const state$ = hot<State>('s-', { s: state } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('--')
        flush()
        expect(trackEvent).toHaveBeenCalledTimes(0)
      })
    })

    it('handles events before config is initialized', () => {
      const action = { type: 'foo' }
      const state = { config: null }

      testScheduler.run(({ hot, expectObservable, flush }) => {
        makeEventMock.mockReturnValueOnce([null] as any)

        const action$ = hot<Action>('-a', { a: action } as any)
        const state$ = hot<State>('s-', { s: state } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('--')
        flush()
        expect(trackEvent).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe('optIntoAnalyticsEvent', () => {
    const off = { config: { analytics: { optedIn: false } } }
    const on = { config: { analytics: { optedIn: true } } }

    it('sets opt-in', () => {
      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', { a: off, b: on } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: true })
      })
    })

    it('sets opt-out', () => {
      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', { a: on, b: off } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: false })
      })
    })

    it('noops on no change in status or if config not yet initialized', () => {
      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', { a: on, b: on } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', { a: off, b: off } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', {
          a: { config: null },
          b: { config: null },
        } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('----')
        const state$ = hot<State>('-a-b', {
          a: { config: null },
          b: on,
        } as any)
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })
    })
  })
})
