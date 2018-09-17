// @flow
// http api client module for /motors/** endpoints
import type {ThunkPromiseAction} from '../types'
import type {ApiCall} from './types'
import type {Mount, RobotService} from '../robot'

import type {PipettesResponse} from './pipettes'
import client from './client'
import {apiRequest, apiSuccess, apiFailure} from './actions'
import type {ApiAction} from './actions'
export type MotorAxis = 'a' | 'b' | 'c' | 'x' | 'y' | 'z'

// not the actual request body because we combine multiple api calls
type DisengageRequest = {
  mounts: Array<Mount>,
}

type DisengageResponse = {
  message: string,
}

type MotorsCall = ApiCall<DisengageRequest, DisengageResponse>

export type MotorsAction =
  | ApiAction<'disengage', null, DisengageResponse>

export type MotorsState = {
  motors?: MotorsCall,
}

const DISENGAGE: 'motors/disengage' = 'motors/disengage'

export function disengagePipetteMotors (
  robot: RobotService,
  ...mounts: Array<Mount>
): ThunkPromiseAction {
  return (dispatch, getState) => {
    const pipettesState = getState().api.api[robot.name].pipettes

    dispatch(apiRequest(robot, DISENGAGE, {mounts}))

    // pull motor axes from state if available, otherwise hit GET /pipettes
    const getPipettes = pipettesState && pipettesState.response
      ? Promise.resolve(pipettesState.response)
      : client(robot, 'GET', 'pipettes')

    return getPipettes
      .then((pipettes: PipettesResponse) => {
        const axes = mounts.reduce((result, mount) => result.concat(
          pipettes[mount].mount_axis,
          pipettes[mount].plunger_axis
        ), [])

        return client(robot, 'POST', 'motors/disengage', {axes})
      })
      .then(
        (response) => apiSuccess(robot, DISENGAGE, response),
        (error) => apiFailure(robot, DISENGAGE, error)
      )
      .then(dispatch)
  }
}
