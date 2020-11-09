// @flow
import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom, pairwise } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../robot/selectors'
import * as Actions from '../actions'

import type { Epic } from '../../types'

export const clearAllSessionsOnDisconnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType('robot:DISCONNECT_RESPONSE', 'robot:UNEXPECTED_DISCONNECT'),
    withLatestFrom(state$, (_a, s) => getConnectedRobotName(s)),
    pairwise(),
    filter(
      ([prevConnectedRobotName, nextConnectedRobotName]) =>
        prevConnectedRobotName != null && nextConnectedRobotName == null
    ),
    switchMap(([prevConnectedRobotName, nextConnectedRobotName]) =>
      of(Actions.clearAllSessions(prevConnectedRobotName))
    )
  )
}
