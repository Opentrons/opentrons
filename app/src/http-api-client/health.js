// @flow
// health http api module
import {createSelector, type Selector} from 'reselect'

import type {State} from '../types'
import type {BaseRobot} from '../robot'
import type {ApiCall} from './types'
import type {ApiAction} from './actions'

import {buildRequestMaker} from './actions'
import {getRobotApiState} from './reducer'

type FetchHealthResponse = {
  name: string,
  api_version: string,
  fw_version: string,
  logs: ?Array<string>,
}

export type HealthAction = ApiAction<'health', null, FetchHealthResponse>

export type FetchHealthCall = ApiCall<void, FetchHealthResponse>

export type RobotHealthState = {
  health?: FetchHealthCall,
}

const HEALTH: 'health' = 'health'

export const fetchHealth = buildRequestMaker('GET', HEALTH)

export const makeGetRobotHealth = () => {
  const selector: Selector<State, BaseRobot, FetchHealthCall> = createSelector(
    getRobotApiState,
    state => state[HEALTH] || {inProgress: false}
  )

  return selector
}
