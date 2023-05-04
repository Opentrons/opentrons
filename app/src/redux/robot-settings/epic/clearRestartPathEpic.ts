import { getRobotRestarting } from '../../robot-admin'
import type { Epic } from '../../types'
import { clearRestartPath } from '../actions'
import { getAllRestartRequiredRobots } from '../selectors'
import { of } from 'rxjs'
import { map, filter, switchMap } from 'rxjs/operators'

export const clearRestartPathEpic: Epic = (action$, state$) => {
  return state$.pipe(
    map(state => {
      return getAllRestartRequiredRobots(state)
        .filter(name => getRobotRestarting(state, name))
        .map(robotName => clearRestartPath(robotName))
    }),
    filter(actions => actions.length > 0),
    switchMap(actions => of(...actions))
  )
}
