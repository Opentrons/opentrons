// @flow
// analytics epics
import { combineEpics, ofType } from 'redux-observable'
import { of, from, zip } from 'rxjs'
import {
  map,
  switchMap,
  filter,
  tap,
  withLatestFrom,
  ignoreElements,
  pairwise,
} from 'rxjs/operators'

import * as Cfg from '../config'
import { getAnalyticsConfig } from './selectors'
import { initializeMixpanel, setMixpanelTracking, trackEvent } from './mixpanel'
import { makeEvent } from './make-event'

import type { State, Action, Epic } from '../types'
import type { ConfigInitializedAction } from '../config/types'
import type { TrackEventArgs, AnalyticsEvent, AnalyticsConfig } from './types'

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
