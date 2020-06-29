// @flow
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'

import { getConnectedRobotName } from '../../robot/selectors'
import type { Epic } from '../../types'
import * as Actions from '../actions'

export const fetchPipettesOnConnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    withLatestFrom(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter(([action, robotName]) => robotName != null),
    switchMap(([action, robotName]) =>
      of(
        Actions.fetchPipettes(robotName),
        Actions.fetchPipetteSettings(robotName)
      )
    )
  )
}
