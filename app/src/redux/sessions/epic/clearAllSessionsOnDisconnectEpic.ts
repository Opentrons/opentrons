import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../robot/selectors'
import * as Actions from '../actions'

import type { Action, Epic } from '../../types'
import type {
  DisconnectAction,
  UnexpectedDisconnectAction,
} from '../../robot/actions'

// NOTE: this epic is responsible for clearing out the (only) redux state of the sessions
// that belong to the connected robot as soon as it is disconnected. This is doing the
// job of what a reducer would more traditionally do, though sessions and "connected"
// state live in different branches of the redux store. This provides a bridge between
// the two branches, that should be removed in favor of reducer logic when the concept of
// "connecting" to a robot is rethought and collocated with session logic.

export const clearAllSessionsOnDisconnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, DisconnectAction | UnexpectedDisconnectAction>(
      'robot:DISCONNECT',
      'robot:UNEXPECTED_DISCONNECT'
    ),
    withLatestFrom(state$, (_a, s) => getConnectedRobotName(s)),
    filter((robotName): robotName is string => {
      return robotName != null
    }),
    switchMap(robotName => of(Actions.clearAllSessions(robotName)))
  )
}
