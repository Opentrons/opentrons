// @flow
// API client for modules (the robot kind)
import {createSelector, type Selector} from 'reselect'

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

type FetchModulesResponse = {
  modules: Array<Module>,
}

type FetchModuleDataResponse = {
  status: string,
  data: TempDeckData | MagDeckData
}

type FetchModulesCall = ApiCall<null, FetchModulesResponse>

export type ModulesAction =
  | ApiAction<'modules', null, FetchModulesResponse>

export type ModulesState = {
  modules?: FetchModulesCall
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
  const selector: Selector<State, BaseRobot, FetchModulesCall> = createSelector(
    getRobotApiState,
    (state) => state[MODULES] || {inProgress: false}
    // TODO(mc, 2018-07-23): DEBUG code; remove soon
    // () => ({
    //   inProgress: false,
    //   error: null,
    //   request: null,
    //   response: {
    //     modules: [
    //       {
    //         name: 'tempdeck',
    //         model: 'temp_deck',
    //         serial: '123123124',
    //         fwVersion: '1.2.13',
    //         status: 'heating',
    //         displayName: 'Temperature Module',
    //         data: {
    //           currentTemp: 60,
    //           targetTemp: 70
    //         }
    //       },
    //       {
    //         name: 'magdeck',
    //         model: 'mag_deck',
    //         serial: '123123124',
    //         fwVersion: '1.2.13',
    //         status: 'disengaged',
    //         displayName: 'Magnetic Bead Module',
    //         data: {
    //           engaged: false
    //         }
    //       }
    //     ]
    //   }
    // })
  )

  return selector
}
