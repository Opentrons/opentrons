// @flow
import { pipe } from 'rxjs'
import { map, mergeMap, withLatestFrom, filter } from 'rxjs/operators'

import { getRobotByName } from '../discovery/selectors'
import { fetchRobotApi } from './http'
import * as Types from './types'

import type { Observable } from 'rxjs'
import type { State } from '../types'

export type ActionToRequestMapper<A> = (
  A,
  State
) => [Types.HostlessRobotApiRequest, Types.RobotApiRequestMeta]

export type ResponseToActionMapper<B> = (
  Types.RobotApiResponse,
  Types.RobotApiRequestMeta,
  State
) => B

export function withRobotHost<A>(
  state$: Observable<State>,
  getRobotName: A => string
): rxjs$OperatorFunction<A, [A, State, Types.RobotHost]> {
  return pipe(
    withLatestFrom(state$, (a: A, s: State): [
      A,
      State,
      Types.RobotHost | null
    ] => [a, s, getRobotByName(s, getRobotName(a))]),
    filter(([a, s, maybeRobot]) => maybeRobot !== null)
  )
}

export function mapToRobotApiRequest<A, B>(
  state$: Observable<State>,
  getRobotName: A => string,
  mapActionToRequest: ActionToRequestMapper<A>,
  mapResponseToAction: ResponseToActionMapper<B>
): rxjs$OperatorFunction<A, B> {
  return pipe(
    withRobotHost(state$, getRobotName),
    map(([a, s, host]) => [host, ...mapActionToRequest(a, s)]),
    // TODO(mc, 2019-11-15): this is a mergeMap rather than switchMap because:
    // - Our vanilla fetch usage means switchMap won't cancel inflight requests
    // - Our request lifecycle state can't handle a cancelled request
    // Change this to a switchMap once one or both of these are addressed
    mergeMap(([host, request, meta]) => {
      return fetchRobotApi(host, request).pipe(
        withLatestFrom(state$),
        map(([response, state]) => mapResponseToAction(response, meta, state))
      )
    })
  )
}
