import { of } from 'rxjs'
import { filter, withLatestFrom, mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../../robot/selectors'
import * as Actions from '../actions'

import type { Epic } from '../../../types'

export const fetchPipetteOffsetCalibrationsOnConnectEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    withLatestFrom(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter(([action, robotName]) => robotName != null),
    mergeMap(robotName => {
      // @ts-expect-error TODO: something is wrong here robotName will be a tuple
      return of(Actions.fetchPipetteOffsetCalibrations(robotName))
    })
  )
}
