// @flow
// analytics epics
import { combineEpics, ofType } from 'redux-observable'
import { from, of, zip } from 'rxjs'
import {
  filter,
  ignoreElements,
  map,
  pairwise,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

import * as Cfg from '../config'
import type { ConfigInitializedAction } from '../config/types'
import type { Action, Epic, State } from '../types'
import { makeEvent } from './make-event'
import { initializeMixpanel, setMixpanelTracking, trackEvent } from './mixpanel'
import { getAnalyticsConfig } from './selectors'
import type { AnalyticsConfig, AnalyticsEvent, TrackEventArgs } from './types'

const initialzeAnalyticsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Cfg.INITIALIZED),
    tap((initAction: ConfigInitializedAction) => {
      const { config } = initAction.payload
      initializeMixpanel(config.analytics)
    }),
    ignoreElements()
  )
}

const sendAnalyticsEventEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$),
    switchMap<[Action, State], _, TrackEventArgs>(([action, state]) => {
      const event$ = from(makeEvent(action, state))
      return zip(event$, of(getAnalyticsConfig(state)))
    }),
    filter(([maybeEvent, maybeConfig]: TrackEventArgs) =>
      Boolean(maybeEvent && maybeConfig)
    ),
    tap(([event, config]: [AnalyticsEvent, AnalyticsConfig]) =>
      trackEvent(event, config)
    ),
    ignoreElements()
  )
}

const optIntoAnalyticsEpic: Epic = (_, state$) => {
  return state$.pipe(
    map<State, AnalyticsConfig | null>(getAnalyticsConfig),
    pairwise(),
    filter(([prev, next]) => next !== null && prev?.optedIn !== next?.optedIn),
    tap(([_, config]: [mixed, AnalyticsConfig]) => setMixpanelTracking(config)),
    ignoreElements()
  )
}

export const analyticsEpic: Epic = combineEpics(
  initialzeAnalyticsEpic,
  sendAnalyticsEventEpic,
  optIntoAnalyticsEpic
)
