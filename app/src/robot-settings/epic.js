// @flow
import { of } from 'rxjs'
import { map, filter, switchMap, mergeMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { makeRobotApiRequest } from '../robot-api/utils'
import { getRobotAdminStatus, RESTARTING_STATUS } from '../robot-admin'
import { clearRestartPath } from './actions'
import { getAllRestartRequiredRobots } from './selectors'
import { FETCH_SETTINGS, UPDATE_SETTING } from './constants'

import type { Epic } from '../types'
import type { RobotSettingsApiAction } from './types'

const robotSettingsApiEpic: Epic = action$ => {
  return action$.pipe(
    ofType(FETCH_SETTINGS, UPDATE_SETTING),
    switchMap<RobotSettingsApiAction, _, _>(a => {
      return makeRobotApiRequest(a.payload, {})
    })
  )
}

const clearRestartPathOnRestarting: Epic = (action$, state$) => {
  return state$.pipe(
    map(state => {
      return getAllRestartRequiredRobots(state)
        .filter(name => getRobotAdminStatus(state, name) === RESTARTING_STATUS)
        .map(robotName => clearRestartPath(robotName))
    }),
    filter(actions => actions.length > 0),
    mergeMap(actions => of(...actions))
  )
}

export const robotSettingsEpic: Epic = combineEpics(
  robotSettingsApiEpic,
  clearRestartPathOnRestarting
)
