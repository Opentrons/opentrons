// @flow
// HTTP API client module for /robot/**
import {createSelector, type Selector} from 'reselect'

import type {PipetteConfig} from '@opentrons/shared-data'
import type {State, ThunkPromiseAction, Action} from '../types'
import type {Mount, BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import client from './client'

type Point = [number, number, number]

type MoveTarget = 'mount' | 'pipette'

type MountPosition = {|
  target: MoveTarget,
  left: Point,
  right: Point,
|}

type Position = {|
  target: MoveTarget,
  point: Point,
|}

type Positions = {|
  change_pipette: MountPosition,
  attach_tip: Position,
|}

type RobotPositionsResponse = {
  positions: Positions,
}

// note: not the actual request body because moveTo is two requests
type RobotMoveRequest =
  | {| position: 'change_pipette', mount: Mount |}
  | {| position: 'attach_tip', mount: Mount, pipette: PipetteConfig |}

type RobotMoveResponse = {
  message: string,
}

type RobotHomeRequest =
  | {target: 'robot'}
  | {target: 'pipette', mount: Mount}

type RobotHomeResponse = {
  message: string,
}

type RobotLightsRequest = ?{
  on: boolean
}

type RobotLightsResponse = {
  on: boolean
}

type RequestPath = 'move' | 'home' | 'lights'

type RobotRequest = RobotMoveRequest | RobotHomeRequest | RobotLightsRequest

type RobotResponse = RobotMoveResponse | RobotHomeResponse | RobotLightsResponse

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
    robot: BaseRobot,
  |}
|}

export type RobotAction =
  | RobotRequestAction
  | RobotSuccessAction
  | RobotFailureAction
  | ClearMoveResponseAction

export type RobotMove = ApiCall<RobotMoveRequest, RobotMoveResponse>

export type RobotHome = ApiCall<RobotHomeRequest, RobotHomeResponse>

export type RobotLights = ApiCall<RobotLightsRequest, RobotLightsResponse>

type RobotByNameState = {
  move?: RobotMove,
  home?: RobotHome,
  lights?: RobotLights,
}

type RobotState = {
  [robotName: string]: ?RobotByNameState,
}

const MOVE: RequestPath = 'move'
const HOME: RequestPath = 'home'
const LIGHTS: RequestPath = 'lights'

export function moveRobotTo (
  robot: RobotService,
  request: RobotMoveRequest
): ThunkPromiseAction {
  const {position, mount} = request

  return (dispatch) => {
    dispatch(robotRequest(robot, MOVE, request))

    return client(robot, 'GET', `robot/positions`)
      .then((response: RobotPositionsResponse) => {
        const positionInfo = response.positions
        const {target} = positionInfo[position]
        const point = position === 'change_pipette'
          ? positionInfo[position][mount]
          : positionInfo[position].point

        let body = {target, point, mount}
        if (request.pipette) body = {...body, model: request.pipette.model}

        return client(robot, 'POST', 'robot/move', body)
      })
      .then(
        (r: RobotMoveResponse) => dispatch(robotSuccess(robot, MOVE, r)),
        (e: ApiRequestError) => dispatch(robotFailure(robot, MOVE, e))
      )
  }
}

export function clearRobotMoveResponse (
  robot: RobotService
): ClearMoveResponseAction {
  return {type: 'api:CLEAR_ROBOT_MOVE_RESPONSE', payload: {robot}}
}

export function home (robot: RobotService, mount?: Mount): ThunkPromiseAction {
  return (dispatch) => {
    const body = mount
      ? {target: 'pipette', mount}
      : {target: 'robot'}

    dispatch(robotRequest(robot, HOME, body))

    return client(robot, 'POST', 'robot/home', body)
      .then(
        (response) => robotSuccess(robot, HOME, response),
        (error) => robotFailure(robot, HOME, error)
      )
      .then(dispatch)
  }
}

export function fetchRobotLights (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(robotRequest(robot, LIGHTS))

    return client(robot, 'GET', 'robot/lights')
      .then(
        (response) => robotSuccess(robot, LIGHTS, response),
        (error) => robotFailure(robot, LIGHTS, error)
      )
      .then(dispatch)
  }
}

export function setRobotLights (
  robot: RobotService,
  on: boolean
): ThunkPromiseAction {
  const body = {on}

  return (dispatch) => {
    dispatch(robotRequest(robot, LIGHTS, body))

    return client(robot, 'POST', 'robot/lights', body)
      .then(
        (response) => robotSuccess(robot, LIGHTS, response),
        (error) => robotFailure(robot, LIGHTS, error)
      )
      .then(dispatch)
  }
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

export const makeGetRobotMove = () => {
  const selector: Selector<State, BaseRobot, RobotMove> = createSelector(
    selectRobotState,
    (state) => state.move || {inProgress: false}
  )

  return selector
}

export const makeGetRobotHome = () => {
  const selector: Selector<State, BaseRobot, RobotHome> = createSelector(
    selectRobotState,
    (state) => state.home || {inProgress: false}
  )

  return selector
}

export const makeGetRobotLights = () => {
  const selector: Selector<State, BaseRobot, RobotLights> = createSelector(
    selectRobotState,
    (state) => state.lights || {inProgress: false}
  )

  return selector
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

function selectRobotState (state: State, props: BaseRobot): RobotByNameState {
  return state.api.robot[props.name] || {}
}
