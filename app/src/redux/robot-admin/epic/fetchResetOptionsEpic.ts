import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { FetchResetConfigOptionsAction, ResetConfigOption } from '../types'
import { ofType } from 'redux-observable'

const mapActionToRequest: ActionToRequestMapper<FetchResetConfigOptionsAction> = action => ({
  method: GET,
  path: Constants.RESET_CONFIG_OPTIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchResetConfigOptionsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const options: ResetConfigOption[] = body.options
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchResetConfigOptionsSuccess(host.name, options, meta)
    : Actions.fetchResetConfigOptionsFailure(host.name, body, meta)
}

export const fetchResetOptionsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchResetConfigOptionsAction>(
      Constants.FETCH_RESET_CONFIG_OPTIONS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
