// @flow
// support profile epic
import { tap, filter, withLatestFrom, ignoreElements } from 'rxjs/operators'

import { makeProfileUpdate, updateProfile } from './profile'

import type { Epic } from '../types'

export const supportEpic: Epic = (action$, state$) => {
  return action$.pipe(
    withLatestFrom(state$, makeProfileUpdate),
    filter(maybeUpdate => maybeUpdate !== null),
    tap(updateProfile),
    ignoreElements()
  )
}
