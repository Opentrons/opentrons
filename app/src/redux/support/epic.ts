// @flow
// support profile epic
import { combineEpics, ofType } from 'redux-observable'
import { tap, filter, withLatestFrom, ignoreElements } from 'rxjs/operators'

import * as Cfg from '../config'
import { initializeProfile, makeProfileUpdate, updateProfile } from './profile'

import { makeIntercomEvent, sendEvent } from './intercom-event'

import type { Epic } from '../types'
import type { ConfigInitializedAction } from '../config/types'

const initializeSupportEpic: Epic = action$ => {
  return action$.pipe(
    ofType(Cfg.INITIALIZED),
    tap((a: ConfigInitializedAction) => {
      initializeProfile(a.payload.config.support)
    }),
    ignoreElements()
  )
}

const updateProfileEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$, makeProfileUpdate),
    filter(maybeUpdate => maybeUpdate !== null),
    tap(updateProfile),
    ignoreElements()
  )
}

const sendEventEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$, makeIntercomEvent),
    filter(maybeSend => maybeSend !== null),
    tap(sendEvent),
    ignoreElements()
  )
}

export const supportEpic: Epic = combineEpics(
  initializeSupportEpic,
  updateProfileEpic,
  sendEventEpic
)
