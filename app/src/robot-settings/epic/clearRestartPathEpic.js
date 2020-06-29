// @flow
import { of } from 'rxjs'
import { filter, map, switchMap } from 'rxjs/operators'

import { getRobotAdminStatus, RESTARTING_STATUS } from '../../robot-admin'
import type { Epic } from '../../types'
import { clearRestartPath } from '../actions'
import { getAllRestartRequiredRobots } from '../selectors'

export const clearRestartPathEpic: Epic = (action$, state$) => {
  return state$.pipe(
    map(state => {
      return getAllRestartRequiredRobots(state)
        .filter(name => getRobotAdminStatus(state, name) === RESTARTING_STATUS)
        .map(robotName => clearRestartPath(robotName))
    }),
    filter(actions => actions.length > 0),
    switchMap(actions => of(...actions))
  )
}
