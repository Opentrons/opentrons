import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { fetchEapOptionsSuccess, fetchEapOptionsFailure } from '../actions'
import { FETCH_EAP_OPTIONS, EAP_OPTIONS_PATH } from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { EapOption, FetchEapOptionsAction } from '../types'
import type { RobotApiErrorResponse } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<FetchEapOptionsAction> = action => ({
  method: GET,
  path: EAP_OPTIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchEapOptionsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? fetchEapOptionsSuccess(host.name, body.options as EapOption[], meta)
    : fetchEapOptionsFailure(host.name, body as RobotApiErrorResponse, meta)
}

export const fetchEapOptionsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchEapOptionsAction>(FETCH_EAP_OPTIONS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
