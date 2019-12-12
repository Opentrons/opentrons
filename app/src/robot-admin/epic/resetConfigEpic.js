// @flow
import { ofType } from 'redux-observable'
import { map } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Constants from '../constants'
import * as Actions from '../actions'
import * as Types from '../types'

import type { StrictEpic } from '../../types'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

const mapActionToRequest: ActionToRequestMapper<Types.ResetConfigAction> = action => ({
  method: POST,
  path: Constants.RESET_CONFIG_PATH,
  body: action.payload.resets,
})

const mapResponseToAction: ResponseToActionMapper<
  Types.ResetConfigAction,
  Types.ResetConfigDoneAction
> = (response, originalAction) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.resetConfigSuccess(host.name, meta)
    : Actions.resetConfigFailure(host.name, body, meta)
}

export const resetConfigEpic: StrictEpic<Types.ResetConfigDoneAction> = (
  action$,
  state$
) => {
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

export const restartOnResetConfigEpic: StrictEpic<Types.RestartRobotAction> = action$ => {
  return action$.pipe(
    ofType(Constants.RESET_CONFIG_SUCCESS),
    map<Types.ResetConfigAction, Types.RestartRobotAction>(a => {
      return Actions.restartRobot(a.payload.robotName)
    })
  )
}
