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
import type { FetchSingleLabwareCalibrationAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchSingleLabwareCalibrationAction> = action => ({
  method: GET,
  path: `${Constants.LABWARE_CALIBRATION_PATH}/${action.payload.calibrationId}`,
})

const mapResponseToAction: ResponseToActionMapper<FetchSingleLabwareCalibrationAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchSingleLabwareCalibrationSuccess(host.name, body, meta)
    : Actions.fetchLabwareCalibrationFailure(host.name, body, meta)
}

export const fetchSingleLabwareCalibrationEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_SINGLE_LABWARE_CALIBRATION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
