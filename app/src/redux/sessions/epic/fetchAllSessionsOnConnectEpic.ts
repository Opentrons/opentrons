import { map } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import * as Robot from '../../robot'
import * as Actions from '../actions'

import type { Action, Epic } from '../../types'
import type { ConnectAction } from '../../robot'

export const fetchAllSessionsOnConnectEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, ConnectAction>(Robot.CONNECT),
    map(action => Actions.fetchAllSessions(action.payload.name))
  )
}
