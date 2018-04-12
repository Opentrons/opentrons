// @flow
//  HTTP API client module for /robot/**
import {createSelector, type Selector} from 'reselect'
import type {State, ThunkPromiseAction, Action} from '../types'
import type {Mount, BaseRobot, RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {type ApiRequestError} from './client'

type Point = [number, number, number]

type Target = 'mount' | 'pipette'

type Position = {
  target: Target,
  left: Point,
  right: Point,
}

// TODO(mc, 2018-04-10): add other positions as necessary
type Positions = {
  change_pipette: Position
}

type PositionName = $Keys<Positions>

type RobotPositionsResponse = {
  positions: Positions
}

type RobotMoveRequest = {
  target: Target,
  point: Point,
  mount: Mount,
  model?: string,
}

type RobotMoveResponse = {
  message: string
}

type RequestPath = 'move'

type RobotRequest = RobotMoveRequest

type RobotResponse = RobotMoveResponse

type RobotRequestAction = {|
  type: 'api:ROBOT_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    request: RobotRequest,
  |}
|}

type RobotSuccessAction = {|
  type: 'api:ROBOT_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: RobotResponse,
  |}
|}

type RobotFailureAction = {|
  type: 'api:ROBOT_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |}
|}

type ClearMoveResponseAction = {|
  type: 'api:CLEAR_ROBOT_MOVE_RESPONSE',
  payload: {|
    robot: BaseRobot
  |}
|}

type SetMovePositionAction = {|
  type: 'api:SET_ROBOT_MOVE_POSITION',
  payload: {|
    robot: BaseRobot,
    position: PositionName,
  |}
|}

export type RobotAction =
  | RobotRequestAction
  | RobotSuccessAction
  | RobotFailureAction
  | SetMovePositionAction
  | ClearMoveResponseAction

export type RobotMove = ApiCall<RobotMoveRequest, RobotMoveResponse>

type RobotByNameState = {
  movePosition?: PositionName,
  move?: RobotMove,
}

type RobotState = {
  [robotName: string]: ?RobotByNameState
}

const MOVE: RequestPath = 'move'

export function moveToChangePipette (
  robot: RobotService,
  mount: Mount
): ThunkPromiseAction {
  return (dispatch) => {
    const position = 'change_pipette'

    dispatch(setRobotMovePosition(robot, position))

    return client(robot, 'GET', `robot/positions`)
      .then((response: RobotPositionsResponse) => {
        const {target, [mount]: point} = response.positions[position]
        const request = {target, point, mount}

        dispatch(robotRequest(robot, MOVE, request))
        return client(robot, 'POST', 'robot/move', request)
      })
      .then(
        (r: RobotMoveResponse) => dispatch(robotSuccess(robot, MOVE, r)),
        (e: ApiRequestError) => dispatch(robotFailure(robot, MOVE, e))
      )
  }
}

function setRobotMovePosition (
  robot: BaseRobot,
  position: PositionName
): SetMovePositionAction {
  return {type: 'api:SET_ROBOT_MOVE_POSITION', payload: {robot, position}}
}

export function clearRobotMoveResponse (
  robot: RobotService
): ClearMoveResponseAction {
  return {type: 'api:CLEAR_ROBOT_MOVE_RESPONSE', payload: {robot}}
}

export function robotReducer (state: ?RobotState, action: Action): RobotState {
  if (!state) return {}

  let name
  let path
  let request
  let response
  let error
  let stateByName

  switch (action.type) {
    case 'api:ROBOT_REQUEST':
      ({path, request, robot: {name}} = action.payload)
      stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {request, inProgress: true, response: null, error: null}
        }
      }

    case 'api:ROBOT_SUCCESS':
      ({path, response, robot: {name}} = action.payload)
      stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {
            ...stateByName[path],
            response,
            inProgress: false,
            error: null
          }
        }
      }

    case 'api:ROBOT_FAILURE':
      ({path, error, robot: {name}} = action.payload)
      stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {
            ...stateByName[path],
            error,
            inProgress: false
          }
        }
      }

    case 'api:SET_ROBOT_MOVE_POSITION':
      ({robot: {name}} = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          movePosition: action.payload.position
        }
      }
    case 'api:CLEAR_ROBOT_MOVE_RESPONSE':
      ({robot: {name}} = action.payload)
      stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          move: {...stateByName.move, response: null}
        }
      }
  }

  return state
}

function robotRequest (
  robot: RobotService,
  path: RequestPath,
  request: RobotRequest
): RobotRequestAction {
  return {type: 'api:ROBOT_REQUEST', payload: {robot, path, request}}
}

function robotSuccess (
  robot: RobotService,
  path: RequestPath,
  response: RobotResponse
): RobotSuccessAction {
  return {
    type: 'api:ROBOT_SUCCESS',
    payload: {robot, path, response}
  }
}

function robotFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): RobotFailureAction {
  return {type: 'api:ROBOT_FAILURE', payload: {robot, path, error}}
}

export type RobotMoveState = RobotMove & {
  position: ?PositionName,
}

export const makeGetRobotMove = () => {
  const selector: Selector<State, BaseRobot, RobotMoveState> = createSelector(
    selectRobotState,
    (state) => state && state.move
      ? {...state.move, position: state.movePosition || null}
      : {
        inProgress: false,
        error: null,
        request: null,
        response: null,
        position: null
      }
  )

  return selector
}

function selectRobotState (state: State, props: BaseRobot): ?RobotByNameState {
  return state.api.robot[props.name]
}
