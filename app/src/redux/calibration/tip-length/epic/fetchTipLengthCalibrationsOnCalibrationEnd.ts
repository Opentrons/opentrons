import { filter, withLatestFrom, map } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../../robot/selectors'
import * as Actions from '../actions'
import type { Action, Epic, State } from '../../../types'

import type { SessionType, DeleteSessionAction } from '../../../sessions/types'
import {
  DELETE_SESSION,
  SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
  SESSION_TYPE_TIP_LENGTH_CALIBRATION,
  SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
} from '../../../sessions/constants'
import { getRobotSessionById } from '../../../sessions/selectors'

const isTargetSessionType = (sessionType: SessionType): boolean =>
  ([
    SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
  ] as SessionType[]).includes(sessionType)

const sessionIncursRefetch: (
  state: State,
  robotName: string,
  sessionId: string
) => boolean = (state, robotName, sessionId) => {
  const sessionType =
    getRobotSessionById(state, robotName, sessionId)?.sessionType || null
  if (sessionType) {
    return isTargetSessionType(sessionType)
  } else {
    return false
  }
}

export const fetchTipLengthCalibrationsOnCalibrationEndEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType<Action, DeleteSessionAction>(DELETE_SESSION),
    withLatestFrom<
      DeleteSessionAction,
      [DeleteSessionAction, State, string, string]
    >(state$, (a, s) => [a, s, getConnectedRobotName(s), a.payload.sessionId]),
    filter(
      ([action, state, robotName, sessionId]) =>
        robotName != null && sessionIncursRefetch(state, robotName, sessionId)
    ),
    map(([_action, _state, robotName, _sessionId]) => {
      return Actions.fetchTipLengthCalibrations(robotName)
    })
  )
}
