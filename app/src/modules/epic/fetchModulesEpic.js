// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchModulesAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchModulesAction> = action => ({
  method: GET,
  path: Constants.MODULES_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchModulesAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchModulesSuccess(host.name, body.modules, meta)
    : Actions.fetchModulesFailure(host.name, body, meta)
}

export const fetchModulesEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_MODULES),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
