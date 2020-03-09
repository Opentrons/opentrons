// analytics epics tests
import { TestScheduler } from 'rxjs/testing'

import { trackEvent, setMixpanelTracking } from '../mixpanel'
import { makeEvent } from '../make-event'
import * as epics from '../epics'

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

  it('sendAnalyticsEventEpic handles events', () => {
    const action = { type: 'foo' }
    const state = { config: { analytics: { optedIn: true } } }
    const event = { name: 'fooEvent', properties: {} }

    testScheduler.run(({ hot, expectObservable }) => {
      makeEvent.mockReturnValueOnce([event])

      const action$ = hot('-a', { a: action })
      const state$ = hot('s-', { s: state })
      const output$ = epics.sendAnalyticsEventEpic(action$, state$)

      expectObservable(output$).toBe('--')
    })

    expect(trackEvent).toHaveBeenCalledWith(event, state.config.analytics)
  })

  it('sendAnalyticsEventEpic handles nulls', () => {
    const action = { type: 'foo' }
    const state = { config: { analytics: { optedIn: true } } }

    testScheduler.run(({ hot, expectObservable }) => {
      makeEvent.mockReturnValueOnce([null])

      const action$ = hot('-a', { a: action })
      const state$ = hot('s-', { s: state })
      const output$ = epics.sendAnalyticsEventEpic(action$, state$)

      expectObservable(output$).toBe('--')
    })

    expect(trackEvent).toHaveBeenCalledTimes(0)
  })

  describe('optIntoAnalyticsEvent', () => {
    const off = { config: { analytics: { optedIn: false } } }
    const on = { config: { analytics: { optedIn: true } } }

    it('sets opt-in', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const state$ = hot('-a-b', { a: off, b: on })
        const output$ = epics.optIntoAnalyticsEpic(null, state$)
        expectObservable(output$).toBe('----')
      })

      expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: true })
    })

    it('sets opt-out', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const state$ = hot('-a-b', { a: on, b: off })
        const output$ = epics.optIntoAnalyticsEpic(null, state$)
        expectObservable(output$).toBe('----')
      })

      expect(setMixpanelTracking).toHaveBeenCalledWith({ optedIn: false })
    })

    it('noops on no change in status', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const state$ = hot('-a-b', { a: on, b: on })
        const output$ = epics.optIntoAnalyticsEpic(null, state$)
        expectObservable(output$).toBe('----')
      })

      testScheduler.run(({ hot, expectObservable }) => {
        const state$ = hot('-a-b', { a: off, b: off })
        const output$ = epics.optIntoAnalyticsEpic(null, state$)
        expectObservable(output$).toBe('----')
      })

      expect(setMixpanelTracking).toHaveBeenCalledTimes(0)
    })
  })
})
