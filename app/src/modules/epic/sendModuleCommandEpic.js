// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type { Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { SendModuleCommandAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<SendModuleCommandAction> = action => ({
  method: POST,
  path: `${Constants.MODULES_PATH}/${action.payload.moduleId}`,
  body: {
    command_type: action.payload.command,
    args: action.payload.args,
  },
})

const mapResponseToAction: ResponseToActionMapper<SendModuleCommandAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const { moduleId, command } = originalAction.payload
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.sendModuleCommandSuccess(
        host.name,
        moduleId,
        command,
        body.returnValue,
        meta
      )
    : Actions.sendModuleCommandFailure(host.name, moduleId, command, body, meta)
}

export const sendModuleCommandEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.SEND_MODULE_COMMAND),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
