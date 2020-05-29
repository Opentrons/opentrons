// @flow
import { of } from 'rxjs'
import { ofType } from 'redux-observable'
import { switchMap } from 'rxjs/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

export const fetchSessionOnCommandResponseEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.CREATE_SESSION_COMMAND_SUCCESS),
    switchMap(action =>
      of(
        Actions.fetchSession(action.payload.robotName, action.payload.sessionId)
      )
    )
  )
}
