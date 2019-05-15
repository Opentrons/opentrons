// @flow
// http api client module for /motors/** endpoints
import { getPipettesState } from '../robot-api'
import { apiRequest, apiSuccess, apiFailure } from './actions'
import client from './client'

import type { ThunkPromiseAction } from '../types'
import type { Mount, RobotService } from '../robot'
import type { ApiAction } from './actions'
import type { ApiCall } from './types'

export type MotorAxis = 'a' | 'b' | 'c' | 'x' | 'y' | 'z'

// not the actual request body because we combine multiple api calls
type DisengageRequest = {
  mounts: Array<Mount>,
}

type DisengageResponse = {
  message: string,
}

type DisengageCall = ApiCall<DisengageRequest, DisengageResponse>

export type MotorsAction = ApiAction<
  'motors/disengage',
  DisengageRequest,
  DisengageResponse
>

export type MotorsState = {|
  'motors/disengage'?: DisengageCall,
|}

const DISENGAGE: 'motors/disengage' = 'motors/disengage'

export function disengagePipetteMotors(
  robot: RobotService,
  ...mounts: Array<Mount>
): ThunkPromiseAction {
  return (dispatch, getState) => {
    const pipettes = getPipettesState(getState(), robot.name)
    const axes = mounts.reduce((result, mount) => {
      const pip = pipettes[mount]
      return pip ? result.concat(pip.mount_axis, pip.plunger_axis) : result
    }, [])

    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    dispatch(apiRequest(robot, DISENGAGE, { mounts }))

    return (
      client(robot, 'POST', 'motors/disengage', { axes })
        .then(
          response => apiSuccess(robot, DISENGAGE, response),
          error => apiFailure(robot, DISENGAGE, error)
        )
        // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
        .then(dispatch)
    )
  }
}
