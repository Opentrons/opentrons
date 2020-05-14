// @flow
import { of, ofType, filter, switchMap } from 'redux-observable'

import * as Sessions from '../../sessions'

import type { Epic } from '../../types'

import { CALIBRATION_CHECK_SESSION_ID } from '../constants'

export const fetchRobotCalibrationCheckSessionEpic: Epic = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Sessions.FETCH_SESSION_FAILURE),
    filter(
      action =>
        action.meta.response.status === 404 &&
        action.payload.error.id === CALIBRATION_CHECK_SESSION_ID
    ),
    switchMap(action =>
      of(
        Sessions.createSession(
          action.payload.robotName,
          CALIBRATION_CHECK_SESSION_ID
        )
      )
    )
  )
}
