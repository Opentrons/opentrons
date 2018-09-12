// @flow
// http api client module for /motors/** endpoints
import type {ThunkPromiseAction} from '../types'
import type {Mount, RobotService} from '../robot'

import type {PipettesResponse} from './pipettes'
import client, {type ApiRequestError} from './client'

export type MotorAxis = 'a' | 'b' | 'c' | 'x' | 'y' | 'z'

// not the actual request body because we combine multiple api calls
type DisengageRequest = {
  mounts: Array<Mount>,
}

type DisengageResponse = {
  message: string,
}

type RequestPath = 'disengage'

type MotorsRequest = DisengageRequest

type MotorsResponse = DisengageResponse

type MotorsRequestAction = {|
  type: 'api:MOTORS_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    request: MotorsRequest,
  |},
|}

type MotorsSuccessAction = {|
  type: 'api:MOTORS_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: MotorsResponse,
  |},
|}

type MotorsFailureAction = {|
  type: 'api:MOTORS_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |},
|}

export type MotorsAction =
  | MotorsRequestAction
  | MotorsSuccessAction
  | MotorsFailureAction

const DISENGAGE: RequestPath = 'disengage'

export function disengagePipetteMotors (
  robot: RobotService,
  ...mounts: Array<Mount>
): ThunkPromiseAction {
  return (dispatch, getState) => {
    const pipettesState = getState().api.pipettes[robot.name]

    dispatch(motorsRequest(robot, DISENGAGE, {mounts}))

    // pull motor axes from state if available, otherwise hit GET /pipettes
    const getPipettes = pipettesState && pipettesState.response
      ? Promise.resolve(pipettesState.response)
      : client(robot, 'GET', 'pipettes')

    return getPipettes
      .then((pipettes: PipettesResponse) => {
        const axes = mounts.reduce((result, mount) => result.concat(
          pipettes[mount].mount_axis,
          pipettes[mount].plunger_axis
        ), [])

        return client(robot, 'POST', 'motors/disengage', {axes})
      })
      .then(
        (response) => motorsSuccess(robot, DISENGAGE, response),
        (error) => motorsFailure(robot, DISENGAGE, error)
      )
      .then(dispatch)
  }
}

// TODO(mc, 2018-04-24): track motor request state
export function motorsReducer () {
  return {}
}

function motorsRequest (
  robot: RobotService,
  path: RequestPath,
  request: MotorsRequest
): MotorsRequestAction {
  return {type: 'api:MOTORS_REQUEST', payload: {robot, path, request}}
}

function motorsSuccess (
  robot: RobotService,
  path: RequestPath,
  response: MotorsResponse
): MotorsSuccessAction {
  return {
    type: 'api:MOTORS_SUCCESS',
    payload: {robot, path, response},
  }
}

function motorsFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): MotorsFailureAction {
  return {type: 'api:MOTORS_FAILURE', payload: {robot, path, error}}
}
