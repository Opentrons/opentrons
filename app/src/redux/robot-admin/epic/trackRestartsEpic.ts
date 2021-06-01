import { ofType, combineEpics } from 'redux-observable'
import { of } from 'rxjs'
import { map, filter, withLatestFrom, switchMap } from 'rxjs/operators'

import { getRobotByName, getDiscoveredRobots } from '../../discovery'
import { getNextRestartStatus } from '../selectors'
import { restartStatusChanged } from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'
import type { RestartRobotSuccessAction } from '../types'
import type { Robot, ReachableRobot } from '../../discovery/types'

// mark robot as restart-pending if HTTP restart request succeeds
const trackRestartBeginEpic: Epic = (action$, state$) => {
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

// mark robot as restart-succeeded if discovery info indicates restart is done
const trackRestartProgressEpic: Epic = (action$, state$) => {
  return state$.pipe(
    switchMap(state => {
      const now = new Date()
      const statusChanges = getDiscoveredRobots(state).flatMap(robot => {
        const { name: robotName, status: connectivityStatus } = robot
        const bootId = robot.serverHealth?.bootId ?? null
        const restartStatus = getNextRestartStatus(
          state,
          robotName,
          connectivityStatus,
          bootId,
          now
        )

        return restartStatus !== null
          ? [restartStatusChanged(robotName, restartStatus)]
          : []
      })

      return of(...statusChanges)
    })
  )
}

export const trackRestartsEpic = combineEpics<Epic>(
  trackRestartBeginEpic,
  trackRestartProgressEpic
)
