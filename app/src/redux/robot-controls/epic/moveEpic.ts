// @flow
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { GET, POST, fetchRobotApi } from '../../robot-api'
import { withRobotHost } from '../../robot-api/operators'
import { getAttachedPipettes } from '../../pipettes'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { State, Action, Epic } from '../../types'
import type {
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'

import type { MoveAction, PositionsResponse } from '../types'

const mapActionToRequest = (
  action: MoveAction,
  state: State,
  positionsResponse: PositionsResponse
): RobotApiRequestOptions => {
  const { robotName, position, mount } = action.payload
  const attachedPipettes = getAttachedPipettes(state, robotName)
  const apiPosition =
    position === Constants.CHANGE_PIPETTE
      ? positionsResponse.positions.change_pipette
      : positionsResponse.positions.attach_tip

  const body =
    apiPosition.target === Constants.MOUNT
      ? { mount, target: Constants.MOUNT, point: apiPosition[mount] }
      : {
          mount,
          target: Constants.PIPETTE,
          point: apiPosition.point,
          model: attachedPipettes[mount]?.model || null,
        }

  return { method: POST, path: Constants.MOVE_PATH, body }
}

const mapResponseToAction = (
  response: RobotApiResponse,
  originalAction: MoveAction
): Action => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.moveSuccess(host.name, meta)
    : Actions.moveFailure(host.name, body, meta)
}

const fetchPositionsRequest = { method: GET, path: Constants.POSITIONS_PATH }

const disengageMotorsRequest = {
  method: POST,
  path: Constants.DISENGAGE_MOTORS_PATH,
  body: { axes: ['a', 'b', 'c', 'z'] },
}

// complicated epic because the endpoints are complicated
// 1. Call GET /robot/positions
// 2. Call POST /robot/move with result of GET /robot/positions
// 3. Call POST /motors/disengage if we need to
export const moveEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.MOVE),
    withRobotHost(state$, a => a.payload.robotName),
    switchMap(([action, state, host]) => {
      // hit GET /robot/positions to figure out what POST /robot/move body will be
      return fetchRobotApi(host, fetchPositionsRequest).pipe(
        switchMap(positionsResponse => {
          // call move endpoint if we have positions, otherwise
          // pass the failure response along
          return positionsResponse.ok
            ? fetchRobotApi(
                host,
                mapActionToRequest(action, state, positionsResponse.body)
              )
            : of(positionsResponse)
        }),
        // at this point we have either a successful movement call,
        // a failed movement call, or a failed position call
        switchMap(maybeMoveSuccess => {
          // if the last call was successful and we need to disengage motors,
          // go ahead and make that call; otherwise pass the response along
          return maybeMoveSuccess.ok && action.payload.disengageMotors
            ? fetchRobotApi(host, disengageMotorsRequest).pipe(
                map(disengageResponse =>
                  // if the disengage call succeeds, make sure we still pass
                  // our movement success response into our final action for
                  // consistency
                  disengageResponse.ok ? maybeMoveSuccess : disengageResponse
                )
              )
            : of(maybeMoveSuccess)
        }),
        // response will be one of:
        // movement success, movement fail, positions fail, disengage fail
        map(response => mapResponseToAction(response, action))
      )
    })
  )
}
