// @flow
// HTTP API client module for /robot/**
import {createSelector, type Selector} from 'reselect'

import type {PipetteConfig} from '@opentrons/shared-data'
import type {State, ThunkPromiseAction, Action} from '../types'
import type {Mount, BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import type {
  ApiRequestAction,
  ApiSuccessAction,
  ApiFailureAction,
  ClearApiResponseAction,
} from './actions'

import {apiRequest, apiSuccess, apiFailure, clearApiResponse} from './actions'
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
  on: boolean,
}

type RobotLightsResponse = {
  on: boolean,
}

type RobotPath =
  | 'robot/move'
  | 'robot/home'
  | 'robot/lights'

type RobotRequest =
  | RobotMoveRequest
  | RobotHomeRequest
  | RobotLightsRequest

type RobotResponse =
  | RobotMoveResponse
  | RobotHomeResponse
  | RobotLightsResponse

export type RobotAction =
  | ApiRequestAction<RobotPath, RobotRequest>
  | ApiSuccessAction<RobotPath, RobotResponse>
  | ApiFailureAction<RobotPath>
  | ClearApiResponseAction<RobotPath>

export type RobotMove = ApiCall<RobotMoveRequest, RobotMoveResponse>

export type RobotHome = ApiCall<RobotHomeRequest, RobotHomeResponse>

export type RobotLights = ApiCall<RobotLightsRequest, RobotLightsResponse>

type RobotByNameState = {
  'robot/move'?: RobotMove,
  'robot/home'?: RobotHome,
  'robot/lights'?: RobotLights,
}

type RobotState = {
  [robotName: string]: ?RobotByNameState,
}

// note: POSITIONS only used inside `moveRobotTo`
const POSITIONS = 'robot/positions'
const MOVE: 'robot/move' = 'robot/move'
const HOME: 'robot/home' = 'robot/home'
const LIGHTS: 'robot/lights' = 'robot/lights'

// TODO(mc, 2018-07-03): flow helper until we have one reducer, since
// p === 'constant' checks but p === CONSTANT does not, even if
// CONSTANT is defined as `const CONSTANT: 'constant' = 'constant'`
function getRobotPath (p: string): ?RobotPath {
  if (p === 'robot/move' || p === 'robot/home' || p === 'robot/lights') {
    return p
  }

  return null
}

export function moveRobotTo (
  robot: RobotService,
  request: RobotMoveRequest
): ThunkPromiseAction {
  const {position, mount} = request

  return (dispatch) => {
    dispatch(apiRequest(robot, MOVE, request))

    return client(robot, 'GET', POSITIONS)
      .then((response: RobotPositionsResponse) => {
        const positionInfo = response.positions
        const {target} = positionInfo[position]
        const point = position === 'change_pipette'
          ? positionInfo[position][mount]
          : positionInfo[position].point

        let body = {target, point, mount}
        if (request.pipette) body = {...body, model: request.pipette.model}

        return client(robot, 'POST', MOVE, body)
      })
      .then(
        (resp: RobotMoveResponse) => apiSuccess(robot, MOVE, resp),
        (err: ApiRequestError) => apiFailure(robot, MOVE, err)
      )
      .then(dispatch)
  }
}

export function home (robot: RobotService, mount?: Mount): ThunkPromiseAction {
  return (dispatch) => {
    const body = mount
      ? {target: 'pipette', mount}
      : {target: 'robot'}

    dispatch(apiRequest(robot, HOME, body))

    return client(robot, 'POST', HOME, body)
      .then(
        (resp: RobotHomeResponse) => apiSuccess(robot, HOME, resp),
        (err: ApiRequestError) => apiFailure(robot, HOME, err)
      )
      .then(dispatch)
  }
}

export function fetchRobotLights (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(apiRequest(robot, LIGHTS, null))

    return client(robot, 'GET', LIGHTS)
      .then(
        (resp: RobotLightsResponse) => apiSuccess(robot, LIGHTS, resp),
        (err: ApiRequestError) => apiFailure(robot, LIGHTS, err)
      )
      .then(dispatch)
  }
}

export function clearHomeResponse (
  robot: BaseRobot
): ClearApiResponseAction<RobotPath> {
  return clearApiResponse(robot, HOME)
}

export function clearMoveResponse (
  robot: BaseRobot
): ClearApiResponseAction<RobotPath> {
  return clearApiResponse(robot, MOVE)
}

export function setRobotLights (
  robot: RobotService,
  on: boolean
): ThunkPromiseAction {
  const request: RobotLightsRequest = {on}

  return (dispatch) => {
    dispatch(apiRequest(robot, LIGHTS, request))

    return client(robot, 'POST', LIGHTS, request)
      .then(
        (resp: RobotLightsResponse) => apiSuccess(robot, LIGHTS, resp),
        (err: ApiRequestError) => apiFailure(robot, LIGHTS, err)
      )
      .then(dispatch)
  }
}

// TODO(mc, 2018-07-03): remove in favor of single HTTP API reducer
export function robotReducer (state: ?RobotState, action: Action): RobotState {
  if (!state) return {}

  switch (action.type) {
    case 'api:REQUEST': {
      const path = getRobotPath(action.payload.path)
      if (!path) return state
      const {payload: {request, robot: {name}}} = action
      const stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {request, inProgress: true, response: null, error: null},
        },
      }
    }

    case 'api:SUCCESS': {
      const path = getRobotPath(action.payload.path)
      if (!path) return state
      const {payload: {response, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response, inProgress: false, error: null},
        },
      }
    }

    case 'api:FAILURE': {
      const path = getRobotPath(action.payload.path)
      if (!path) return state
      const {payload: {error, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, error, inProgress: false},
        },
      }
    }

    case 'api:CLEAR_RESPONSE': {
      const path = getRobotPath(action.payload.path)
      if (!path) return state
      const {payload: {robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response: null, error: null},
        },
      }
    }
  }

  return state
}

export const makeGetRobotMove = () => {
  const selector: Selector<State, BaseRobot, RobotMove> = createSelector(
    selectRobotState,
    (state) => state[MOVE] || {inProgress: false}
  )

  return selector
}

export const makeGetRobotHome = () => {
  const selector: Selector<State, BaseRobot, RobotHome> = createSelector(
    selectRobotState,
    (state) => state[HOME] || {inProgress: false}
  )

  return selector
}

export const makeGetRobotLights = () => {
  const selector: Selector<State, BaseRobot, RobotLights> = createSelector(
    selectRobotState,
    (state) => state[LIGHTS] || {inProgress: false}
  )

  return selector
}

function selectRobotState (state: State, props: BaseRobot): RobotByNameState {
  return state.api.robot[props.name] || {}
}
