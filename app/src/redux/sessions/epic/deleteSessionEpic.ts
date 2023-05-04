import { DELETE } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import * as Actions from '../actions'
import * as Constants from '../constants'
import type { DeleteSessionAction } from '../types'
import { ofType } from 'redux-observable'

const mapActionToRequest: ActionToRequestMapper<DeleteSessionAction> = action => ({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}`,
})

const mapResponseToAction: ResponseToActionMapper<DeleteSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.deleteSessionSuccess(host.name, body, meta)
    : Actions.deleteSessionFailure(
        host.name,
        originalAction.payload.sessionId,
        body,
        meta
      )
}

export const deleteSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, DeleteSessionAction>(Constants.DELETE_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
