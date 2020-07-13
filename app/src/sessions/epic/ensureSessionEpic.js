// @flow
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { fetchRobotApi } from '../../robot-api'
import { withRobotHost } from '../../robot-api/operators'

import * as Constants from '../constants'

import type { State, Epic } from '../../types'
import type { RobotHost } from '../../robot-api/types'

import {
  mapActionToRequest as mapActionToFetchAllRequest,
  mapResponseToAction as mapFetchAllResponseToAction,
} from './fetchAllSessionsEpic'

import {
  mapActionToRequest as mapActionToCreateRequest,
  mapResponseToAction as mapCreateResponseToAction,
} from './createSessionEpic'

import type { EnsureSessionAction } from '../types'

// this epic exists to ensure that a session of a given type exists in state
// it will fetch all sessions and, if the correct session type doesn't already
// exist, create a session if necessary. Relies heavily on the machinery and
// actions of fetchAllSessionsEpic and createSessionEpic
export const ensureSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.ENSURE_SESSION),
    withRobotHost<EnsureSessionAction>(state$, a => a.payload.robotName),
    switchMap<[EnsureSessionAction, State, RobotHost], _, _>(
      ([originalAction, state, host]) => {
        const { sessionType } = originalAction.payload
        const fetchAllRequest = mapActionToFetchAllRequest()
        const createRequest = mapActionToCreateRequest(originalAction)

        return fetchRobotApi(host, fetchAllRequest).pipe(
          switchMap(fetchResponse => {
            const { ok, body } = fetchResponse
            // if fetch all failed or body included the correct sessionType,
            // we're done
            if (
              !ok ||
              body.data.some(s => s.attributes.sessionType === sessionType)
            ) {
              return of(
                mapFetchAllResponseToAction(fetchResponse, originalAction)
              )
            }

            // else fetch all succeeded and there was no sessionType, so create one
            return fetchRobotApi(host, createRequest).pipe(
              map(response => {
                return mapCreateResponseToAction(response, originalAction)
              })
            )
          })
        )
      }
    )
  )
}
