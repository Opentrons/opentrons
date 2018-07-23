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

export type Module = {
  name: 'magdeck' | 'tempdeck',
  model: string,
  serial: string,
  fwVersion: string,
  status: string,
  displayName: string,
}

type FetchModulesResponse = {
  modules: Array<Module>,
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
    //         status: '86',
    //         displayName: 'Temperature Module'
    //       },
    //       {
    //         name: 'magdeck',
    //         model: 'mag_deck',
    //         serial: '123123124',
    //         fwVersion: '1.2.13',
    //         status: 'disengaged',
    //         displayName: 'Magnetic Bead Module'
    //       }
    //     ]
    //   }
    // })
  )

  return selector
}
