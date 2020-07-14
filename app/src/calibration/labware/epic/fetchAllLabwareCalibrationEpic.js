// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../../robot-api/constants'
import { mapToRobotApiRequest } from '../../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../../robot-api/operators'
import type { Epic } from '../../../types'
import type { FetchLabwareCalibrationAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchLabwareCalibrationAction> = action => {
  const { robotName, ...payloadWithoutRobot } = action.payload

  return {
    method: GET,
    path: Constants.LABWARE_CALIBRATION_PATH,
    query: payloadWithoutRobot,
  }
}

const mapResponseToAction: ResponseToActionMapper<FetchLabwareCalibrationAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchLabwareCalibrationsSuccess(host.name, body, meta)
    : Actions.fetchLabwareCalibrationsFailure(host.name, body, meta)
}

export const fetchAllLabwareCalibrationEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_ALL_LABWARE_CALIBRATIONS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
