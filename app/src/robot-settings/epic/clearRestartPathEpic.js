// @flow
import { of } from 'rxjs'
import { map, filter, switchMap } from 'rxjs/operators'
import { getRobotAdminStatus, RESTARTING_STATUS } from '../../robot-admin'
import { clearRestartPath } from '../actions'
import { getAllRestartRequiredRobots } from '../selectors'

import type { StrictEpic } from '../../types'
import type { ClearRestartPathAction } from '../types'

export const clearRestartPathEpic: StrictEpic<ClearRestartPathAction> = (
  action$,
  state$
) => {
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
