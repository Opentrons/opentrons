// support profile epic
import { combineEpics, ofType } from 'redux-observable'
import { tap, filter, withLatestFrom, ignoreElements } from 'rxjs/operators'

import * as Cfg from '../config'
import { initializeProfile, makeProfileUpdate, updateProfile } from './profile'

import { makeIntercomEvent, sendEvent } from './intercom-event'

import type { Action, Epic } from '../types'
import type { ConfigInitializedAction } from '../config/types'
import { IntercomEvent, SupportProfileUpdate } from './types'

const initializeSupportEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, ConfigInitializedAction>(Cfg.INITIALIZED),
    tap((a: ConfigInitializedAction) => {
      initializeProfile(a.payload.config.support)
    }),
    ignoreElements()
  )
}

const updateProfileEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$, makeProfileUpdate),
    filter<SupportProfileUpdate | null, SupportProfileUpdate>(
      (maybeUpdate): maybeUpdate is SupportProfileUpdate => maybeUpdate !== null
    ),
    tap(updateProfile),
    ignoreElements()
  )
}

const sendEventEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$, makeIntercomEvent),
    filter<IntercomEvent | null, IntercomEvent>(
      (maybeSend): maybeSend is IntercomEvent => maybeSend !== null
    ),
    tap(sendEvent),
    ignoreElements()
  )
}

export const supportEpic: Epic = combineEpics<Epic>(
  initializeSupportEpic,
  updateProfileEpic,
  sendEventEpic
)
