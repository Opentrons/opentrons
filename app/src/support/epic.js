// @flow
// support profile epic
import { combineEpics, ofType } from 'redux-observable'
import { filter, ignoreElements, tap, withLatestFrom } from 'rxjs/operators'

import * as Cfg from '../config'
import type { ConfigInitializedAction } from '../config/types'
import type { Epic } from '../types'
import { initializeProfile, makeProfileUpdate, updateProfile } from './profile'

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

export const supportEpic: Epic = combineEpics(
  initializeSupportEpic,
  updateProfileEpic
)
