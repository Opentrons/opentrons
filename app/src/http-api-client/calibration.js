// @flow
// http api client module for /calibration/**
import type {Action, ThunkPromiseAction} from '../types'
import type {RobotService, Mount} from '../robot'
import type {ApiCall, ApiRequestError} from './types'

import client from './client'

type DeckStartRequest = {
  force?: boolean
}

type DeckStartResponse = {
  token: string,
  pipette: {
    mount: Mount,
    model: string
  },
}

type CalRequest = DeckStartRequest

type CalResponse = DeckStartResponse

type RequestPath = 'deck/start'

type CalRequestAction = {|
  type: 'api:CAL_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    request: CalRequest,
  |}
|}

type CalSuccessAction = {|
  type: 'api:CAL_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: CalResponse,
  |}
|}

type CalFailureAction = {|
  type: 'api:CAL_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |}
|}

export type CalibrationAction =
  | CalRequestAction
  | CalSuccessAction
  | CalFailureAction

type RobotCalState = {
  'deck/start': ?ApiCall<DeckStartRequest, DeckStartResponse>
}

type CalState = {
  [robotName: string]: ?RobotCalState
}

// const DECK: RequestPath = 'deck'
const DECK_START: RequestPath = 'deck/start'

// DEBUG(mc, 2018-04-30): remove when UI is wired
global.startDeckCalibration = startDeckCalibration

export function startDeckCalibration (
  robot: RobotService,
  force: boolean = false
): ThunkPromiseAction {
  const request = {force}

  return (dispatch) => {
    dispatch(calRequest(robot, DECK_START, request))

    return client(robot, 'POST', `calibration/${DECK_START}`, request)
      .then((res: DeckStartResponse) => calSuccess(robot, DECK_START, res))
      .catch((err: ApiRequestError) => calFailure(robot, DECK_START, err))
      .then(dispatch)
  }
}

export function calibrationReducer (
  state: ?CalState,
  action: Action
): CalState {
  if (!state) return {}

  let name
  let path
  let request
  let response
  let error
  let stateByName

  switch (action.type) {
    case 'api:CAL_REQUEST':
      ({path, request, robot: {name}} = action.payload)
      stateByName = state[name] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {request, inProgress: true, response: null, error: null}
        }
      }

    case 'api:CAL_SUCCESS':
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

    case 'api:CAL_FAILURE':
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
  }

  return state
}

function calRequest (
  robot: RobotService,
  path: RequestPath,
  request: CalRequest
): CalRequestAction {
  return {type: 'api:CAL_REQUEST', payload: {robot, path, request}}
}

function calSuccess (
  robot: RobotService,
  path: RequestPath,
  response: CalResponse
): CalSuccessAction {
  return {type: 'api:CAL_SUCCESS', payload: {robot, path, response}}
}

function calFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): CalFailureAction {
  return {type: 'api:CAL_FAILURE', payload: {robot, path, error}}
}
