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

jest.mock('../make-event')
jest.mock('../mixpanel')

describe('analytics epics', () => {
  let testScheduler

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
      const action = Cfg.configInitialized({ analytics: { optedIn: true } })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('-a', { a: action })
        const state$ = hot('--', {})
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
        makeEvent.mockReturnValueOnce([event])

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
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
        makeEvent.mockReturnValueOnce([null])

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
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
        makeEvent.mockReturnValueOnce([null])

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
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
        const action$ = hot('----')
        const state$ = hot('-a-b', { a: off, b: on })
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: true })
      })
    })

    it('sets opt-out', () => {
      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('----')
        const state$ = hot('-a-b', { a: on, b: off })
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: false })
      })
    })

    it('noops on no change in status', () => {
      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('----')
        const state$ = hot('-a-b', { a: on, b: on })
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('----')
        const state$ = hot('-a-b', { a: off, b: off })
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('----')
        const state$ = hot('-a-b', { a: { config: null }, b: { config: null } })
        const output$ = analyticsEpic(action$, state$)

        expectObservable(output$).toBe('----')
        flush()
        expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
      })
    })
  })
})
