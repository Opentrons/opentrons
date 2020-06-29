// @flow
import { ofType } from 'redux-observable'
import { map } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { ResetConfigAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<ResetConfigAction> = action => ({
  method: POST,
  path: Constants.RESET_CONFIG_PATH,
  body: action.payload.resets,
})

const mapResponseToAction: ResponseToActionMapper<ResetConfigAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.resetConfigSuccess(host.name, meta)
    : Actions.resetConfigFailure(host.name, body, meta)
}

export const resetConfigEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.RESET_CONFIG),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

export const restartOnResetConfigEpic: Epic = action$ => {
  return action$.pipe(
    ofType(Constants.RESET_CONFIG_SUCCESS),
    map<ResetConfigAction, _>(a => {
      return Actions.restartRobot(a.payload.robotName)
    })
  )
}
