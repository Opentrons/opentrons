// @flow
// API client for modules (the robot kind)
import {createSelector} from 'reselect'

import type {OutputSelector} from 'reselect'
import type {State, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import type {ApiAction} from './actions'

import {apiRequest, apiSuccess, apiFailure} from './actions'
import {getRobotApiState} from './reducer'
import client from './client'

export type BaseModule = {|
  model: string,
  serial: string,
  fwVersion: string,
  status: string,
|}

type TempDeckData = {|
  currentTemp: number,
  targetTemp: number,
|}

type MagDeckData = {|
  engaged: boolean,
|}

export type TempDeckModule = {|
  ...BaseModule,
  name: 'tempdeck',
  displayName: 'Temperature Module',
  data: TempDeckData,
|}

export type MagDeckModule = {|
  ...BaseModule,
  name: 'magdeck',
  displayName: 'Magnetic Bead Module',
  data: MagDeckData,
|}

export type Module = MagDeckModule | TempDeckModule

export type FetchModulesResponse = {
  modules: Array<Module>,
}

export type FetchModuleDataResponse = {
  status: string,
  data: TempDeckData | MagDeckData,
}

type FetchModulesCall = ApiCall<null, FetchModulesResponse>

type FetchModuleDataCall = ApiCall<null, FetchModuleDataResponse>

export type ModulesAction =
  | ApiAction<'modules', null, FetchModulesResponse>

export type ModulesState = {
  modules?: FetchModulesCall,
}

const MODULES: 'modules' = 'modules'

export function fetchModules (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(apiRequest(robot, MODULES, null))

    return client(robot, 'GET', MODULES)
      .then(
        (resp: FetchModulesResponse) => apiSuccess(robot, MODULES, resp),
        (err: ApiRequestError) => apiFailure(robot, MODULES, err)
      )
      .then(dispatch)
  }
}

const DATA: 'data' = 'data'

export function fetchModuleData (robot: RobotService, serial: string): ThunkPromiseAction {
  return (dispatch) => {
    const fetchDataPath = `${MODULES}/${serial}/${DATA}`
    dispatch(apiRequest(robot, fetchDataPath, null))

    return client(robot, 'GET', fetchDataPath)
      .then(
        (resp: FetchModuleDataResponse) => apiSuccess(robot, fetchDataPath, resp),
        (err: ApiRequestError) => apiFailure(robot, fetchDataPath, err)
      )
      .then(dispatch)
  }
}

export function makeGetRobotModules () {
  const selector: OutputSelector<State, BaseRobot, FetchModulesCall> = createSelector(
    getRobotApiState,
    (state) => state[MODULES] || {inProgress: false}
  )

  return selector
}

export function makeGetRobotModuleData () {
  const selector: OutputSelector<State, BaseRobot, FetchModuleDataCall> = createSelector(
    (state, robot, _serial) => (getRobotApiState(state, robot)),
    (_state, _robot, serial) => serial,
    (state, serial) => {
      const fetchDataPath = `${MODULES}/${serial}/${DATA}`
      return state[fetchDataPath] || {inProgress: false}
    }
  )

  return selector
}
