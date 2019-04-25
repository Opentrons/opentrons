// @flow
// API client for modules (the robot kind)
import { createSelector } from 'reselect'
import type { OutputSelector } from 'reselect'
import type { State, ThunkPromiseAction } from '../types'
import type { BaseRobot, RobotService } from '../robot'
import type { ApiCall, ApiRequestError } from './types'
import type { ApiAction } from './actions'

import { apiRequest, apiSuccess, apiFailure } from './actions'
import { getRobotApiState } from './reducer'
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

export type FetchTemperatureDataResponse = {
  status: string,
  data: TempDeckData,
}

export type SetTemperatureRequest = {
  command_type: 'set_temperature' | 'deactivate',
  args?: Array<number>,
}

export type SetTemperatureResponse = {
  message: string,
  returnValue: ?string,
}

// TODO (ka 2019-4-8): Getting MagDeck data is possible but not in use
// keeping data response as TD and TC for polling for now
export type FetchModuleDataResponse = FetchTemperatureDataResponse

type FetchModulesCall = ApiCall<null, FetchModulesResponse>

type FetchModuleDataCall = ApiCall<null, FetchModuleDataResponse>

export type ModulesAction = ApiAction<'modules', null, FetchModulesResponse>

export type ModulesState = {|
  modules?: FetchModulesCall,
|}

const MODULES: 'modules' = 'modules'

export function fetchModules(robot: RobotService): ThunkPromiseAction {
  return dispatch => {
    // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
    dispatch(apiRequest(robot, MODULES, null))

    return (
      client(robot, 'GET', MODULES)
        .then(
          (resp: FetchModulesResponse) => apiSuccess(robot, MODULES, resp),
          (err: ApiRequestError) => apiFailure(robot, MODULES, err)
        )
        // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

const DATA: 'data' = 'data'

export function fetchModuleData(
  robot: RobotService,
  serial: string
): ThunkPromiseAction {
  return dispatch => {
    const fetchDataPath = `${MODULES}/${serial}/${DATA}`
    // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
    dispatch(apiRequest(robot, fetchDataPath, null))

    return (
      client(robot, 'GET', fetchDataPath)
        .then(
          (resp: FetchModuleDataResponse) =>
            apiSuccess(robot, fetchDataPath, resp),
          (err: ApiRequestError) => apiFailure(robot, fetchDataPath, err)
        )
        // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

export function setTargetTemp(
  robot: RobotService,
  serial: string,
  command: SetTemperatureRequest
): ThunkPromiseAction {
  return dispatch => {
    const setTempPath = `${MODULES}/${serial}`
    // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
    dispatch(apiRequest(robot, setTempPath, command))

    return (
      client(robot, 'POST', setTempPath, command)
        .then(
          (resp: SetTemperatureResponse) =>
            apiSuccess(robot, setTempPath, resp),
          (err: ApiRequestError) => apiFailure(robot, setTempPath, err)
        )
        // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

export function makeGetRobotModules() {
  const selector: OutputSelector<
    State,
    BaseRobot,
    FetchModulesCall
  > = createSelector(
    getRobotApiState,
    state => state.config,
    (state, config) => {
      const tcEnabled = !!config.devInternal?.enableThermocycler
      const modulesCall = state[MODULES]

      // TODO: remove this block when feature flag removed
      if (modulesCall && modulesCall.response) {
        return {
          ...modulesCall,
          response: {
            modules: modulesCall.response.modules.filter(mod => {
              return tcEnabled || mod.name !== 'thermocycler'
            }),
          },
        }
      }

      return modulesCall || { inProgress: false }
    }
  )

  return selector
}

export function makeGetRobotModuleData() {
  const selector: OutputSelector<
    State,
    BaseRobot,
    FetchModuleDataCall
  > = createSelector(
    (state, robot, _serial) => getRobotApiState(state, robot),
    (_state, _robot, serial) => serial,
    (state, serial) => {
      const fetchDataPath = `${MODULES}/${serial}/${DATA}`
      return state[fetchDataPath] || { inProgress: false }
    }
  )

  return selector
}
