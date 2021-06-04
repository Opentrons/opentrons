import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../robot/selectors'
import * as Actions from '../actions'

import type { Action, Epic } from '../../types'

export const fetchAllSessionsOnConnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    withLatestFrom(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter((args): args is [Action, string] => {
      const [, robotName] = args
      return robotName != null
    }),
    switchMap(([action, robotName]) => of(Actions.fetchAllSessions(robotName)))
  )
}
