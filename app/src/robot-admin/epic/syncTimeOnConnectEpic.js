// @flow
import { ofType } from 'redux-observable'
import { filter, map, switchMap, ignoreElements } from 'rxjs/operators'
import { parseISO, differenceInSeconds } from 'date-fns'

import { GET, PUT, fetchRobotApi } from '../../robot-api'
import { withRobotHost } from '../../robot-api/operators'
import * as Constants from '../constants'

import type { Epic } from '../../types'
import type { RobotApiRequestOptions } from '../../robot-api/types'
import type { ConnectAction } from '../../robot/actions'

const SYNC_THRESHOLD_SEC = 60

const mapActionToFetchRequest = (
  action: ConnectAction
): RobotApiRequestOptions => {
  return { method: GET, path: Constants.SYSTEM_TIME_PATH }
}

const createUpdateRequest = (date: Date): RobotApiRequestOptions => {
  return {
    method: PUT,
    path: Constants.SYSTEM_TIME_PATH,
    body: {
      data: {
        type: 'SystemTimeAttributes',
        attributes: { systemTime: date.toISOString() },
      },
    },
  }
}

export const syncTimeOnConnectEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType('robot:CONNECT'),
    withRobotHost(state$, action => action.payload.name),
    // TODO(mc, 2020-09-08): only fetch if health.links.systemTime exists,
    // see TODO in robot-server/robot_server/service/legacy/models/health.py
    switchMap(([action, state, robot]) => {
      const fetchSystemTimeReq = mapActionToFetchRequest(action)

      return fetchRobotApi(robot, fetchSystemTimeReq).pipe(
        filter(response => response.ok),
        map(response => response.body.data.attributes.systemTime),
        filter(systemTimeString => {
          const systemTime = parseISO(systemTimeString)
          const drift = differenceInSeconds(systemTime, new Date())
          return Math.abs(drift) > SYNC_THRESHOLD_SEC
        }),
        switchMap(() => {
          const updateSystemTimeReq = createUpdateRequest(new Date())
          return fetchRobotApi(robot, updateSystemTimeReq)
        })
      )
    }),
    ignoreElements()
  )
}
