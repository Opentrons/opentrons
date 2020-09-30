// @flow

import { of } from 'rxjs'
import { filter, withLatestFrom, mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { getConnectedRobotName } from '../../../robot/selectors'
import * as Actions from '../actions'
import type { Epic } from '../../../types'

import type { SessionType } from '../../../sessions/types'
import {
  DELETE_SESSION_SUCCESS,
  SESSION_TYPE_CALIBRATION_CHECK,
  SESSION_TYPE_TIP_LENGTH_CALIBRATION,
  SESSION_TYPE_DECK_CALIBRATION,
  SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
} from '../../../sessions/constants'

const sessionIncursRefetch: SessionType => boolean = sessionType =>
  [
    SESSION_TYPE_CALIBRATION_CHECK,
    SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    SESSION_TYPE_DECK_CALIBRATION,
    SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
  ].includes(sessionType)

export const fetchTipLengthCalibrationsOnCalibrationEndEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(DELETE_SESSION_SUCCESS),
    withLatestFrom(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter(
      ([action, robotName]) =>
        sessionIncursRefetch(action.payload.data.attributes.sessionType) &&
        robotName != null
    ),
    mergeMap(robotName => {
      return of(Actions.fetchTipLengthCalibrations(robotName))
    })
  )
}
