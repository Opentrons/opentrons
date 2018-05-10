// @flow
// http api client module for /calibration/**
import {createSelector, type Selector} from 'reselect'
import type {State, Action, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService, Mount} from '../robot'
import type {ApiCall, ApiRequestError} from './types'

import client from './client'

export type JogAxis = 'x' | 'y' | 'z'

export type JogDirection = -1 | 1

export type JogStep = number

export type DeckCalPoint = '1' | '2' | '3'

type DeckStartRequest = {
  force?: boolean
}

type DeckStartResponse = {
  token: string,
  pipette: {
    mount: Mount,
    model: string,
  },
}

type DeckCalRequest =
  | {| command: 'attach tip', tipLength: number |}
  | {| command: 'detach tip' |}
  | {| command: 'jog', axis: JogAxis, direction: JogDirection, step: JogStep |}
  | {| command: 'save xy', point: DeckCalPoint |}
  | {| command: 'save z' |}
  | {| command: 'save transform' |}
  | {| command: 'release' |}

type DeckCalResponse = {
  message: string,
}

type CalRequest = DeckStartRequest | DeckCalRequest

type CalResponse = DeckStartResponse | DeckCalResponse

type RequestPath =
  | 'deck/start'
  | 'deck'

type CalRequestAction = {|
  type: 'api:CAL_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    request: CalRequest,
  |},
|}

type CalSuccessAction = {|
  type: 'api:CAL_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: CalResponse,
  |},
|}

type CalFailureAction = {|
  type: 'api:CAL_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |},
|}

type SetCalJogStepAction = {|
  type: 'api:SET_CAL_JOG_STEP',
  payload: {|
    step: JogStep,
  |},
|}

export type CalibrationAction =
  | CalRequestAction
  | CalSuccessAction
  | CalFailureAction
  | SetCalJogStepAction

export type DeckCalStartState = ApiCall<DeckStartRequest, DeckStartResponse>

export type DeckCalCommandState = ApiCall<DeckCalRequest, DeckCalResponse>

type RobotCalState = {
  'deck/start'?: DeckCalStartState,
  deck?: DeckCalCommandState,
}

type CalState = {
  jogStep: JogStep,
  [robotName: string]: ?RobotCalState,
}

const DECK: 'deck' = 'deck'
const DECK_START: 'deck/start' = 'deck/start'

const DEFAULT_JOG_STEP = 0.1

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

export function deckCalibrationCommand (
  robot: RobotService,
  request: DeckCalRequest
): ThunkPromiseAction {
  return (dispatch, getState) => {
    const state = getRobotCalState(getState(), robot)
    const startState = getStartStateFromCalState(state)
    const token = startState.response && startState.response.token

    dispatch(calRequest(robot, DECK, request))

    return client(robot, 'POST', `calibration/${DECK}`, {...request, token})
      .then((res: DeckCalResponse) => calSuccess(robot, DECK, res))
      .catch((err: ApiRequestError) => calFailure(robot, DECK, err))
      .then(dispatch)
  }
}

export function setCalibrationJogStep (step: JogStep): SetCalJogStepAction {
  return {type: 'api:SET_CAL_JOG_STEP', payload: {step}}
}

export function calibrationReducer (
  state: ?CalState,
  action: Action
): CalState {
  if (!state) return {jogStep: DEFAULT_JOG_STEP}

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

      // TODO(mc, 2018-05-07): this has a race condition if a new /deck request
      //  is fired w/ one already in flight; disallow this
      if (
        path === DECK && stateByName[DECK] && stateByName[DECK].request &&
        stateByName[DECK].request.command === 'release'
      ) {
        stateByName = {
          ...stateByName,
          [DECK_START]: {
            ...stateByName[DECK_START],
            error: null,
            response: null
          }
        }
      }

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

    case 'api:SET_CAL_JOG_STEP':
      return {...state, jogStep: action.payload.step}
  }

  return state
}

export function makeGetDeckCalibrationStartState () {
  const sel: Selector<State, BaseRobot, DeckCalStartState> = createSelector(
    getRobotCalState,
    getStartStateFromCalState
  )

  return sel
}

export function makeGetDeckCalibrationCommandState () {
  const sel: Selector<State, BaseRobot, DeckCalCommandState> = createSelector(
    getRobotCalState,
    getDeckStateFromCalState
  )

  return sel
}

export function getCalibrationJogStep (state: State): JogStep {
  return state.api.calibration.jogStep
}

function getRobotCalState (state: State, props: BaseRobot): RobotCalState {
  return state.api.calibration[props.name] || {}
}

function getStartStateFromCalState (state: RobotCalState): DeckCalStartState {
  return state[DECK_START] || {
    inProgress: false,
    error: null,
    request: null,
    response: null
  }
}

function getDeckStateFromCalState (state: RobotCalState): DeckCalCommandState {
  return state[DECK] || {
    inProgress: false,
    error: null,
    request: null,
    response: null
  }
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
