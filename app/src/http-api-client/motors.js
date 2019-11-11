// @flow
// http api client module for /motors/** endpoints
import { apiRequest, apiSuccess, apiFailure } from './actions'
import client from './client'

import type { ThunkPromiseAction } from '../types'
import type { Mount, RobotService } from '../robot'
import type { ApiAction } from './actions'
import type { ApiCall } from './types'

const AXES = ['a', 'b', 'c', 'z']

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
  robot: RobotService
): ThunkPromiseAction {
  return (dispatch, getState) => {
    const request = { axes: AXES }

    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    dispatch(apiRequest(robot, DISENGAGE, request))

    return (
      client(robot, 'POST', 'motors/disengage', request)
        .then(
          response => apiSuccess(robot, DISENGAGE, response),
          error => apiFailure(robot, DISENGAGE, error)
        )
        // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
        .then(dispatch)
    )
  }
}
