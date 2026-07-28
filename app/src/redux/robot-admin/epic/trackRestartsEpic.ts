import { ofType } from 'redux-observable'
import { filter, map, withLatestFrom } from 'rxjs/operators'

import { getRobotByName } from '../../discovery'
import { restartStatusChanged } from '../actions'
import * as Constants from '../constants'

import type { ReachableRobot, Robot } from '../../discovery/types'
import type { Action, Epic } from '../../types'
import type { RestartRobotSuccessAction } from '../types'

/**
 * Mark robot as restart-pending if HTTP restart request succeeds.
 * Progress tracking lives in
 * useTrackRobotRestarts. 
 * 
 * Kept for resetConfig / restartEpic until those
 * paths move off Redux.
 */
export const trackRestartBeginEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, RestartRobotSuccessAction>(Constants.RESTART_SUCCESS),
    withLatestFrom(state$, (a, s) => getRobotByName(s, a.payload.robotName)),
    filter(
      (maybeRobot): maybeRobot is Robot | ReachableRobot => maybeRobot != null
    ),
    map(robot => {
      const startTime = new Date()
      return restartStatusChanged(
        robot.name,
        Constants.RESTART_PENDING_STATUS,
        robot.serverHealth?.bootId ?? null,
        startTime
      )
    })
  )
}
