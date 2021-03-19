// @flow

import { filter, withLatestFrom, map } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../../robot/selectors'
import * as Actions from '../actions'
import type { Epic, State } from '../../../types'

import type { SessionType } from '../../../sessions/types'
import {
  DELETE_SESSION,
  SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
  SESSION_TYPE_TIP_LENGTH_CALIBRATION,
  SESSION_TYPE_DECK_CALIBRATION,
  SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
} from '../../../sessions/constants'
import { getRobotSessionById } from '../../../sessions/selectors'

const isTargetSessionType: SessionType => boolean = sessionType =>
  [
    SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    SESSION_TYPE_DECK_CALIBRATION,
    SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
  ].includes(sessionType)

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

export const fetchPipetteOffsetCalibrationsOnCalibrationEndEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(DELETE_SESSION),
    withLatestFrom(state$, (a, s) => [
      a,
      s,
      getConnectedRobotName(s),
      a.payload.sessionId,
    ]),
    filter(
      ([action, state, robotName, sessionId]) =>
        robotName != null && sessionIncursRefetch(state, robotName, sessionId)
    ),
    map(([_action, _state, robotName, _sessionId]) => {
      return Actions.fetchPipetteOffsetCalibrations(robotName)
    })
  )
}
