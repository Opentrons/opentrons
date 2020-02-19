// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { HomeAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<HomeAction> = action => ({
  method: POST,
  path: Constants.HOME_PATH,
  body:
    action.payload.target === Constants.ROBOT
      ? { target: Constants.ROBOT }
      : { target: Constants.PIPETTE, mount: action.payload.mount },
})

const mapResponseToAction: ResponseToActionMapper<HomeAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.homeSuccess(host.name, meta)
    : Actions.homeFailure(host.name, body, meta)
}

export const homeEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.HOME),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
