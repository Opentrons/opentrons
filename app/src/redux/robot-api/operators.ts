import { pipe } from 'rxjs'
import { map, mergeMap, withLatestFrom, filter } from 'rxjs/operators'

import { getRobotByName } from '../discovery/selectors'
import { fetchRobotApi } from './http'
import * as Types from './types'

import type { Observable, UnaryFunction, OperatorFunction } from 'rxjs'
import type { State, Action } from '../types'
import type { RobotHost } from './types'

export type ActionToRequestMapper<TriggerAction> = (
  triggerAction: TriggerAction,
  state: State
) => Types.RobotApiRequestOptions | null

export type ResponseToActionMapper<TriggerAction> = (
  response: Types.RobotApiResponse,
  triggerAction: TriggerAction,
  state: State
) => Action

export function withRobotHost<A>(
  state$: Observable<State>,
  getRobotName: (action: A) => string
): UnaryFunction<Observable<A>, Observable<[A, State, RobotHost]>> {
  return pipe(
    withLatestFrom(state$, (a: A, s: State): [A, State, RobotHost | null] => [
      a,
      s,
      getRobotByName(s, getRobotName(a)) as RobotHost | null,
    ]),
    filter((args): args is [A, State, RobotHost] => {
      const [, , maybeRobot] = args
      return maybeRobot !== null
    })
  )
}

export function mapToRobotApiRequest<A>(
  state$: Observable<State>,
  getRobotName: (action: A) => string,
  mapActionToRequest: ActionToRequestMapper<A>,
  mapResponseToAction: ResponseToActionMapper<A>
): OperatorFunction<A, Action> {
  return pipe(
    withRobotHost(state$, getRobotName),
    map(([a, s, host]) => [host, mapActionToRequest(a, s), a]),
    filter(([_host, request, _origAction]) => request !== null),
    // TODO(mc, 2019-11-15): this is a mergeMap rather than switchMap because:
    // - Our vanilla fetch usage means switchMap won't cancel inflight requests
    // - Our request lifecycle state can't handle a cancelled request
    // Change this to a switchMap once one or both of these are addressed
    mergeMap(([host, request, origAction]) => {
      // @ts-expect-error(sa, 2021-05-17): host could be null, type guard in the filter
      return fetchRobotApi(host, request).pipe(
        withLatestFrom(state$),
        // @ts-expect-error(sa, 2021-05-17): action could be null, type guard in the filter
        map(([resp, state]) => mapResponseToAction(resp, origAction, state))
      )
    })
  )
}
