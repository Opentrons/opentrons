import { ofType } from 'redux-observable'
import { interval } from 'rxjs'
import { switchMap, withLatestFrom, map, takeWhile } from 'rxjs/operators'

import { getConnectedRobotName } from '../../robot/selectors'
import { fetchModules } from '../actions'

import type { Action, Epic } from '../../types'
import type { ConnectAction } from '../../robot/actions'

const POLL_MODULE_INTERVAL_MS = 5000

export const pollModulesWhileConnectedEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, ConnectAction>('robot:CONNECT'),
    switchMap(() => {
      return interval(POLL_MODULE_INTERVAL_MS).pipe(
        withLatestFrom(state$, (_, state) => getConnectedRobotName(state)),
        takeWhile<string | null, any>((robotName): robotName is string =>
          Boolean(robotName)
        ),
        map((robotName: string) => fetchModules(robotName))
      )
    })
  )
}
