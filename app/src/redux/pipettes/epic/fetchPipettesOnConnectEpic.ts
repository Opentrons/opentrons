import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../robot/selectors'
import * as Actions from '../actions'

import type { Observable } from 'rxjs'
import type { Action, Epic } from '../../types'
import type { ConnectResponseAction } from '../../robot/actions'

export const fetchPipettesOnConnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, ConnectResponseAction>('robot:CONNECT_RESPONSE'),
    withLatestFrom<
      ConnectResponseAction,
      [ConnectResponseAction, string | null]
    >(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter<
      [ConnectResponseAction, string | null],
      [ConnectResponseAction, string]
    >((args): args is [ConnectResponseAction, string] => {
      return args[1] != null
    }),
    switchMap<[ConnectResponseAction, string], Observable<any>>(
      ([action, robotName]) =>
        of(
          Actions.fetchPipettes(robotName),
          Actions.fetchPipetteSettings(robotName)
        )
    )
  )
}
