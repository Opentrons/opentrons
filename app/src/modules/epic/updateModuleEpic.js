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
import type { UpdateModuleAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdateModuleAction> = action => ({
  method: POST,
  path: `${Constants.MODULES_PATH}/${action.payload.moduleId}/${Constants.MODULE_UPDATE_PATH_EXT}`,
})

const mapResponseToAction: ResponseToActionMapper<UpdateModuleAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const { moduleId } = originalAction.payload
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.updateModuleSuccess(host.name, moduleId, body.message, meta)
    : Actions.updateModuleFailure(host.name, moduleId, body, meta)
}

export const updateModuleEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.UPDATE_MODULE),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
