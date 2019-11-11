// @flow
import { filter, map, withLatestFrom } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { getConnectedRobotName } from '../../robot/selectors'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { StrictEpic, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type {
  AttachedPipettesByMount,
  FetchPipettesAction,
  FetchPipettesDoneAction,
  FetchPipettesResponseBody,
} from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchPipettesAction> = action => [
  {
    method: GET,
    path: Constants.PIPETTES_PATH,
    query: action.payload.refresh ? { refresh: true } : {},
  },
  action.meta,
]

const mapBodyToModel = (
  body: FetchPipettesResponseBody
): AttachedPipettesByMount => ({
  left: body.left.id !== null ? body.left : null,
  right: body.right.id !== null ? body.right : null,
})

const mapResponseToAction: ResponseToActionMapper<FetchPipettesDoneAction> = (
  response,
  prevMeta
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...prevMeta, response: responseMeta }

  return response.ok
    ? Actions.fetchPipettesSuccess(host.name, mapBodyToModel(body), meta)
    : Actions.fetchPipettesFailure(host.name, body, meta)
}

export const handleFetchPipettesEpic: StrictEpic<FetchPipettesDoneAction> = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.FETCH_PIPETTES),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

export const fetchPipettesOnConnectEpic: StrictEpic<FetchPipettesAction> = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    withLatestFrom(state$, (a, s) => [a, getConnectedRobotName(s)]),
    filter(([action, robotName]) => robotName != null),
    map(([action, robotName]) => Actions.fetchPipettes(robotName))
  )
}

export const fetchPipettesEpic: Epic = combineEpics(
  handleFetchPipettesEpic,
  fetchPipettesOnConnectEpic
)
