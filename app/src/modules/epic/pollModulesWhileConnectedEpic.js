// @flow
import { ofType } from 'redux-observable'
import { interval } from 'rxjs'
import {
  filter,
  map,
  mergeMap,
  takeWhile,
  withLatestFrom,
} from 'rxjs/operators'

import type { ConnectResponseAction } from '../../robot/actions'
import { getConnectedRobotName } from '../../robot/selectors'
import type { Epic } from '../../types'
import { fetchModules } from '../actions'

const POLL_MODULE_INTERVAL_MS = 5000

export const pollModulesWhileConnectedEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    filter<ConnectResponseAction>(action => !action.payload?.error),
    mergeMap(() => {
      return interval(POLL_MODULE_INTERVAL_MS).pipe(
        withLatestFrom(state$, (_, state) => getConnectedRobotName(state)),
        takeWhile<string | null, any>(robotName => Boolean(robotName)),
        map((robotName: string) => fetchModules(robotName))
      )
    })
  )
}
