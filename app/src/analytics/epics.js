// @flow
// analytics epics
import { combineEpics } from 'redux-observable'
import { of, from, zip } from 'rxjs'
import {
  map,
  mergeMap,
  filter,
  tap,
  withLatestFrom,
  ignoreElements,
  pairwise,
} from 'rxjs/operators'

import { setMixpanelTracking, trackEvent } from './mixpanel'
import { makeEvent } from './make-event'

import type { State, Action, Epic } from '../types'
import type { TrackEventArgs, AnalyticsConfig } from './types'

export const sendAnalyticsEventEpic: Epic = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    mergeMap<[Action, State], _, TrackEventArgs>(([action, state]) => {
      const event$ = from(makeEvent(action, state))
      return zip(event$, of(state.config.analytics))
    }),
    filter<TrackEventArgs>(([maybeEvent]) => Boolean(maybeEvent)),
    tap(([event, config]) => trackEvent(event, config)),
    ignoreElements()
  )

export const optIntoAnalyticsEpic: Epic = (_, state$) =>
  state$.pipe(
    map(state => state.config.analytics),
    pairwise(),
    filter<[AnalyticsConfig, AnalyticsConfig]>(
      ([prev, next]) => prev.optedIn !== next.optedIn
    ),
    tap(([_, config]) => setMixpanelTracking(config)),
    ignoreElements()
  )

export const analyticsEpic: Epic = combineEpics(
  sendAnalyticsEventEpic,
  optIntoAnalyticsEpic
)
