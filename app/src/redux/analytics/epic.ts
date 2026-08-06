// analytics epics
import { combineEpics, ofType } from 'redux-observable'
import { from, of, zip } from 'rxjs'
import {
  filter,
  ignoreElements,
  mergeMap,
  pairwise,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

import * as Cfg from '../config'
import { makeEvent } from './make-event'
import { initializeMixpanel, setMixpanelTracking, trackEvent } from './mixpanel'
import { getAnalyticsConfig, getAnalyticsOptedIn } from './selectors'

import type { Observable, OperatorFunction } from 'rxjs'
import type { ConfigInitializedAction } from '../config/types'
import type { Action, Epic, State } from '../types'
import type { AnalyticsConfig, AnalyticsEvent, TrackEventArgs } from './types'

const initializeAnalyticsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, ConfigInitializedAction>(Cfg.INITIALIZED),
    tap((initAction: ConfigInitializedAction) => {
      const { config } = initAction.payload
      initializeMixpanel(config.analytics, config.isOnDevice)
    }),
    ignoreElements() as OperatorFunction<ConfigInitializedAction, never>
  )
}

const sendAnalyticsEventEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$),
    // use a merge map to ensure actions dispatched in the same tick do
    // not clobber each other
    mergeMap<[Action, State], Observable<TrackEventArgs>>(([action, state]) => {
      const event$ = from(makeEvent(action, state))
      return zip(event$, of(getAnalyticsConfig(state)))
    }),
    filter<TrackEventArgs, [AnalyticsEvent, AnalyticsConfig]>(
      (args): args is [AnalyticsEvent, AnalyticsConfig] => {
        const [maybeEvent, maybeConfig] = args
        return Boolean(maybeEvent != null && maybeConfig)
      }
    ),
    tap(([event, config]: [AnalyticsEvent, AnalyticsConfig]) => {
      trackEvent(event, config)
    }),
    ignoreElements() as OperatorFunction<
      [AnalyticsEvent, { appId: string; optedIn: boolean }],
      never
    >
  )
}

const optIntoAnalyticsEpic: Epic = (_, state$) => {
  return state$.pipe(
    // now this pipe receive the entire state to pass isOnDevice to setMixpanelTracking
    // isOnDevice is used to distinguish appMode Desktop or ODD
    pairwise(),
    filter(
      ([prevState, nextState]) =>
        getAnalyticsOptedIn(prevState) !== getAnalyticsOptedIn(nextState)
    ),
    tap(([_, state]: [State, State]) => {
      if (state.config?.analytics != null) {
        setMixpanelTracking(state.config?.analytics, state.config?.isOnDevice)
      }
    }),
    ignoreElements() as OperatorFunction<[State, State], never>
  )
}

export const analyticsEpic: Epic = combineEpics<Epic>(
  initializeAnalyticsEpic,
  sendAnalyticsEventEpic,
  optIntoAnalyticsEpic
)
